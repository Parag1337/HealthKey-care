import express from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { auth, AuthRequest, authorize } from '../middleware/auth.js';
import { getDoctorQrToken, issueDoctorQrToken, resolveQrToken } from '../services/qrService.js';
import { hasActiveAccess, hasPendingRequest } from '../services/accessService.js';

const router = express.Router();

router.get('/qr', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    let result = await getDoctorQrToken(String(req.user!._id));
    if (!result.token) {
      result = await issueDoctorQrToken(String(req.user!._id));
    }
    res.json({
      token: result.token,
      payload: result.payload,
      expiresAt: result.expiresAt
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load QR code.' });
  }
});

router.post('/qr/regenerate', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const result = await issueDoctorQrToken(String(req.user!._id));
    res.json({
      token: result.token,
      payload: result.payload,
      expiresAt: result.expiresAt,
      message: 'QR code regenerated. Previous QR codes are no longer valid.'
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Could not regenerate QR code.' });
  }
});

const resolveSchema = z.object({
  token: z.string().min(10).max(256)
});

router.post('/resolve-qr', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const { token } = resolveSchema.parse(req.body);
    const resolved = await resolveQrToken(token);
    if (!resolved) {
      return res.status(400).json({
        message: 'This QR code is invalid or has expired. Ask the doctor to refresh their QR code.'
      });
    }

    const doctor = await User.findById(resolved.doctorId).select('name specialization hospital email role');
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({ message: 'This QR code does not belong to a doctor.' });
    }

    const hasActive = await hasActiveAccess(String(req.user!._id), resolved.doctorId);
    const pending = await hasPendingRequest(String(req.user!._id), resolved.doctorId);

    res.json({
      doctor: {
        id: String(doctor._id),
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital
      },
      hasActiveAccess: hasActive,
      hasPendingRequest: Boolean(pending)
    });
  } catch (err: any) {
    if (err?.errors) {
      return res.status(400).json({ message: 'The QR code could not be read. Please try again.' });
    }
    res.status(400).json({ message: 'Could not read QR code.' });
  }
});

export default router;