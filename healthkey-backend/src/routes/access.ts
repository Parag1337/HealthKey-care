import express from 'express';
import { z } from 'zod';
import AccessRequest from '../models/AccessRequest.js';
import User from '../models/User.js';
import { auth, AuthRequest, authorize } from '../middleware/auth.js';
import { recordAudit, auditActor } from '../services/auditService.js';
import { blockchainService } from '../services/blockchainService.js';
import { resolveQrToken, hashToken } from '../services/qrService.js';
import { hasActiveAccess, hasPendingRequest } from '../services/accessService.js';
import { ACCESS_PERMISSIONS } from '../constants/index.js';

const router = express.Router();

function serializeAccessRequest(doc: any) {
  const plain = doc.toObject();
  if (plain.doctorId && typeof plain.doctorId === 'object') {
    plain.doctor = plain.doctorId;
    plain.doctorId = String(plain.doctorId._id || plain.doctorId);
  }
  if (plain.patientId && typeof plain.patientId === 'object') {
    plain.patient = plain.patientId;
    plain.patientId = String(plain.patientId._id || plain.patientId);
  }
  if (plain.requester && typeof plain.requester === 'object') {
    plain.requester = plain.requester.name || String(plain.requester._id);
  }
  if (plain.approver && typeof plain.approver === 'object') {
    plain.approver = plain.approver.name || String(plain.approver._id);
  }
  delete plain.qrTokenHash;
  return plain;
}

const permissionSchema = z.object({
  records: z.boolean().default(false),
  prescriptions: z.boolean().default(false),
  vitals: z.boolean().default(false)
});

const requestSchema = z
  .object({
    doctorId: z.string().length(24).optional(),
    qrToken: z.string().min(10).max(256).optional(),
    permissions: permissionSchema,
    requestedHours: z.number().int().min(1).max(24 * 30).default(24)
  })
  .refine((data) => Boolean(data.doctorId) !== Boolean(data.qrToken), {
    message: 'Provide either a doctorId or a qrToken, not both.'
  })
  .refine((data) => data.permissions.records || data.permissions.prescriptions || data.permissions.vitals, {
    message: 'Select at least one type of information to share.'
  });

router.post('/request', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const validated = requestSchema.parse(req.body);

    let doctorId = validated.doctorId;
    let qrTokenHash: string | undefined;

    if (validated.qrToken) {
      const resolved = await resolveQrToken(validated.qrToken);
      if (!resolved) {
        return res.status(400).json({
          message: 'This QR code is invalid or has expired. Ask the doctor to refresh their QR code.'
        });
      }
      doctorId = resolved.doctorId;
    }

    const doctor = await User.findById(doctorId).select('role name specialization hospital');
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({ message: 'This QR code does not belong to a doctor.' });
    }

    if (await hasActiveAccess(String(req.user!._id), doctorId!)) {
      return res.status(409).json({
        message: 'You already have active access with this doctor.'
      });
    }

    const existingPending = await hasPendingRequest(String(req.user!._id), doctorId!);
    if (existingPending) {
      return res.status(409).json({
        message: 'You already have a pending access request with this doctor. Please wait for them to respond.'
      });
    }

    const request = await AccessRequest.create({
      patientId: req.user!._id,
      doctorId,
      permissions: validated.permissions,
      status: 'pending',
      requester: req.user!._id,
      requestedHours: validated.requestedHours,
      requestedAt: new Date(),
      qrTokenHash: validated.qrToken ? hashToken(validated.qrToken) : undefined
    });

    const tx = await blockchainService.recordAccessRequest({
      requestId: String(request._id),
      actorId: String(req.user!._id),
      patientId: String(req.user!._id),
      doctorId: String(doctorId)
    });

    await recordAudit({
      patientId: String(req.user!._id),
      ...auditActor(req.user!),
      action: 'access_requested',
      details: {
        requestId: String(request._id),
        doctorId: String(doctorId),
        doctorName: doctor.name,
        permissions: validated.permissions,
        requestedHours: validated.requestedHours,
        txId: tx.txId
      }
    });

    res.status(201).json(request);
  } catch (err: any) {
    if (err?.errors) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Invalid access request.' });
    }
    res.status(400).json({ message: err.message || 'Failed to create access request' });
  }
});

router.get('/my', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const requests = await AccessRequest.find({ patientId: req.user!._id })
      .populate('doctorId', 'name specialization hospital')
      .populate('approver', 'name')
      .sort({ createdAt: -1 });
    res.json(requests.map(serializeAccessRequest));
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load access requests.' });
  }
});

router.get('/doctor', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const requests = await AccessRequest.find({ doctorId: req.user!._id })
      .populate('patientId', 'name email')
      .populate('requester', 'name')
      .sort({ createdAt: -1 });
    res.json(requests.map(serializeAccessRequest));
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load access requests.' });
  }
});

router.get('/active', auth, async (req: AuthRequest, res) => {
  try {
    const query =
      req.user!.role === 'patient'
        ? { patientId: req.user!._id }
        : { doctorId: req.user!._id };
    const requests = await AccessRequest.find({
      ...query,
      status: 'approved',
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    })
      .populate('doctorId', 'name specialization hospital')
      .populate('patientId', 'name email')
      .sort({ approvedAt: -1 });
    res.json(requests.map(serializeAccessRequest));
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load active access.' });
  }
});

router.patch('/:id/approve', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (String(request.doctorId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'This request was not addressed to you.' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ message: 'This request is no longer pending.' });
    }

    const expiresAt = new Date(request.requestedAt.getTime() + request.requestedHours * 60 * 60 * 1000);
    request.status = 'approved';
    request.approver = req.user!._id;
    request.approvedAt = new Date();
    request.decidedAt = new Date();
    request.expiresAt = expiresAt;
    await request.save();

    const tx = await blockchainService.recordAccessApproval({
      requestId: String(request._id),
      actorId: String(req.user!._id),
      patientId: String(request.patientId),
      doctorId: String(request.doctorId)
    });

    await recordAudit({
      patientId: String(request.patientId),
      ...auditActor(req.user!),
      action: 'access_approved',
      details: {
        requestId: String(request._id),
        expiresAt,
        permissions: request.permissions,
        txId: tx.txId
      }
    });

    res.json(request);
  } catch (err: any) {
    console.error('approve error', err);
    res.status(500).json({ message: 'Could not approve request.' });
  }
});

router.patch('/:id/deny', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (String(request.doctorId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'This request was not addressed to you.' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ message: 'This request is no longer pending.' });
    }

    request.status = 'denied';
    request.approver = req.user!._id;
    request.decidedAt = new Date();
    await request.save();

    await recordAudit({
      patientId: String(request.patientId),
      ...auditActor(req.user!),
      action: 'access_denied',
      details: { requestId: String(request._id) }
    });

    res.json(request);
  } catch (err: any) {
    res.status(500).json({ message: 'Could not deny request.' });
  }
});

router.patch('/:id/revoke', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (String(request.patientId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'You can only manage your own access requests.' });
    }
    if (request.status !== 'approved') {
      return res.status(409).json({ message: 'This request is not currently active.' });
    }

    request.status = 'revoked';
    request.revokedAt = new Date();
    request.revokedBy = req.user!._id;
    await request.save();

    await recordAudit({
      patientId: String(req.user!._id),
      ...auditActor(req.user!),
      action: 'access_revoked',
      details: { requestId: String(request._id), doctorId: String(request.doctorId) }
    });

    await blockchainService.recordAccessRevocation({
      requestId: String(request._id),
      actorId: String(req.user!._id),
      patientId: String(request.patientId),
      doctorId: String(request.doctorId)
    });

    res.json(request);
  } catch (err: any) {
    res.status(500).json({ message: 'Could not revoke access.' });
  }
});

router.delete('/:id', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (String(request.patientId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'You can only manage your own access requests.' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ message: 'Only pending requests can be cancelled.' });
    }
    await request.deleteOne();
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ message: 'Could not cancel request.' });
  }
});

export default router;