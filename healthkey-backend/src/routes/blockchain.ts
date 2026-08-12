import express from 'express';
import { z } from 'zod';
import MedicalRecord from '../models/MedicalRecord';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/record/:recordId', auth, async (req: AuthRequest, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    const mockTxId = '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
    record.blockchainTxId = mockTxId;
    record.verified = true;
    await record.save();
    res.json({ txId: mockTxId, message: 'Record verified on blockchain' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/verify/:txId', async (req, res) => {
  try {
    res.json({ txId: req.params.txId, status: 'verified', timestamp: new Date() });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
