import express from 'express';
import { z } from 'zod';
import AccessRequest from '../models/AccessRequest';
import User from '../models/User';
import { auth, AuthRequest, authorize } from '../middleware/auth';

const router = express.Router();

const accessSchema = z.object({
  doctorId: z.string(),
  expiresInHours: z.number().optional()
});

router.post('/request', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const { doctorId } = accessSchema.parse(req.body);
    const request = await AccessRequest.create({
      patientId: req.user!._id,
      doctorId
    });
    res.status(201).json(request);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to create access request' });
  }
});

router.get('/my', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const requests = await AccessRequest.find({ patientId: req.user!._id }).populate('doctorId', 'name specialization hospital');
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/doctor', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const requests = await AccessRequest.find({ doctorId: req.user!._id }).populate('patientId', 'name email');
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/approve', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const request = await AccessRequest.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + (req.body.expiresInHours || 24) * 60 * 60 * 1000)
    });
    res.json(request);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/deny', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const request = await AccessRequest.findByIdAndUpdate(req.params.id, { status: 'denied' });
    res.json(request);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
