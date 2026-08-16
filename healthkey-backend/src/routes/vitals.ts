import express from 'express';
import { z } from 'zod';
import Vital from '../models/Vital.js';
import { auth, AuthRequest, authorize } from '../middleware/auth.js';
import { requirePatientAccess } from '../middleware/access.js';

const router = express.Router();

const vitalSchema = z.object({
  heartRate: z.number().min(20).max(300).optional(),
  spo2: z.number().min(0).max(100).optional(),
  bloodPressure: z.string().max(30).optional(),
  temperature: z.number().min(30).max(45).optional(),
  glucose: z.number().min(0).max(1000).optional(),
  data: z.record(z.any()).optional()
});

router.post('/ingest', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const validated = vitalSchema.parse(req.body);
    const vital = await Vital.create({
      ...validated,
      patientId: req.user!._id
    });
    res.status(201).json(vital);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to ingest vital' });
  }
});

router.get('/my', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const vitals = await Vital.find({ patientId: req.user!._id }).sort({ createdAt: -1 }).limit(50);
    res.json(vitals);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/patient/:patientId', auth, requirePatientAccess('vitals'), async (req: AuthRequest, res) => {
  try {
    const vitals = await Vital.find({ patientId: req.params.patientId }).sort({ createdAt: -1 }).limit(50);
    res.json(vitals);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;