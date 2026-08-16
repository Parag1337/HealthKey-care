import express from 'express';
import AuditEvent from '../models/AuditEvent.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/my', auth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const events =
      user.role === 'patient'
        ? await AuditEvent.find({ patientId: user._id }).sort({ createdAt: -1 }).limit(50)
        : await AuditEvent.find({ $or: [{ doctorId: user._id }, { actorId: user._id }] }).sort({ createdAt: -1 }).limit(50);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load audit history.' });
  }
});

export default router;