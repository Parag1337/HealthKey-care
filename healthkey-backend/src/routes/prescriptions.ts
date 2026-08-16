import express from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import Prescription from '../models/Prescription.js';
import { auth, AuthRequest, authorize } from '../middleware/auth.js';
import { requirePatientAccess } from '../middleware/access.js';
import { recordAudit, auditActor } from '../services/auditService.js';
import { blockchainService } from '../services/blockchainService.js';

const router = express.Router();

const medicineSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dosage: z.string().trim().max(80).optional().or(z.literal('')),
  frequency: z.string().trim().max(80).optional().or(z.literal('')),
  duration: z.string().trim().max(80).optional().or(z.literal('')),
  instructions: z.string().trim().max(300).optional().or(z.literal(''))
});

const prescriptionSchema = z.object({
  patientId: z.string().length(24),
  diagnosis: z.string().trim().min(1).max(300),
  medicines: z.array(medicineSchema).min(1).max(30),
  notes: z.string().trim().max(2000).optional().or(z.literal(''))
});

router.post('/create', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const validated = prescriptionSchema.parse(req.body);

    const active = await requirePatientAccessOnDoctor(validated.patientId, String(req.user!._id));
    if (!active) {
      return res.status(403).json({
        message:
          'Access denied. You do not have active consent to write prescriptions for this patient. Request access again to continue.'
      });
    }

    const canonical = JSON.stringify({
      doctorId: String(req.user!._id),
      patientId: validated.patientId,
      diagnosis: validated.diagnosis,
      medicines: validated.medicines,
      notes: validated.notes || ''
    });

    const prescription = await Prescription.create({
      patientId: validated.patientId,
      doctorId: req.user!._id,
      diagnosis: validated.diagnosis,
      medicines: validated.medicines,
      notes: validated.notes,
      integrityHash: crypto.createHash('sha256').update(canonical).digest('hex')
    });

    const tx = await blockchainService.recordDocumentUpload({
      recordId: String(prescription._id),
      hash: prescription.integrityHash!,
      actorId: String(req.user!._id),
      patientId: validated.patientId
    });
    prescription.blockchainTxId = tx.txId;
    await prescription.save();

    await recordAudit({
      patientId: validated.patientId,
      ...auditActor(req.user!),
      action: 'prescription_created',
      details: {
        prescriptionId: String(prescription._id),
        diagnosis: validated.diagnosis,
        medicines: validated.medicines.length,
        txId: tx.txId
      }
    });

    res.status(201).json(prescription);
  } catch (err: any) {
    if (err?.errors) {
      return res.status(400).json({ message: 'Please provide valid prescription details.' });
    }
    res.status(400).json({ message: err.message || 'Failed to create prescription' });
  }
});

async function requirePatientAccessOnDoctor(patientId: string, doctorId: string) {
  const { hasActiveAccess } = await import('../services/accessService.js');
  return hasActiveAccess(patientId, doctorId, 'prescriptions');
}

router.get('/patient/:patientId', auth, requirePatientAccess('prescriptions'), async (req: AuthRequest, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization hospital')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load prescriptions.' });
  }
});

router.get('/my', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user!._id })
      .populate('doctorId', 'name specialization hospital')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load prescriptions.' });
  }
});

export default router;