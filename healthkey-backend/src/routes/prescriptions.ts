import express from 'express';
import { z } from 'zod';
import Prescription from '../models/Prescription';
import { auth, AuthRequest, authorize } from '../middleware/auth';

const router = express.Router();

const prescriptionSchema = z.object({
  patientId: z.string(),
  diagnosis: z.string(),
  medicines: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string()
  })),
  notes: z.string().optional()
});

router.post('/create', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const validated = prescriptionSchema.parse(req.body);
    const prescription = await Prescription.create({
      ...validated,
      doctorId: req.user!._id
    });
    res.status(201).json(prescription);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to create prescription' });
  }
});

router.get('/patient/:patientId', auth, async (req: AuthRequest, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId }).populate('doctorId', 'name specialization hospital');
    res.json(prescriptions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user!._id }).populate('doctorId', 'name specialization hospital');
    res.json(prescriptions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
