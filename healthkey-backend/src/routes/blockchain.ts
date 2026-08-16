import express from 'express';
import MedicalRecord from '../models/MedicalRecord.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { requireRecordAccess } from '../middleware/access.js';
import { blockchainService } from '../services/blockchainService.js';
import { sha256File } from '../services/fileService.js';

const router = express.Router();

router.post('/verify/:recordId', auth, requireRecordAccess, async (req: AuthRequest, res) => {
  try {
    const record = req.record!;
    const currentHash = await sha256File(record.storedFilename).catch(() => null);

    const result = {
      recordId: String(record._id),
      title: record.title,
      storedHash: record.sha256Hash,
      currentHash: currentHash ?? 'UNAVAILABLE',
      matches: currentHash === record.sha256Hash,
      transaction: record.blockchainTxId
        ? await blockchainService.getTransaction(record.blockchainTxId)
        : null,
      uploadedAt: record.createdAt
    };

    if (!result.matches) {
      record.verificationStatus = 'failed';
      await record.save();
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Could not verify document.' });
  }
});

router.get('/tx/:txId', auth, async (req: AuthRequest, res) => {
  try {
    const tx = await blockchainService.getTransaction(req.params.txId);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const record = req.params.txId ? await MedicalRecord.findOne({ blockchainTxId: req.params.txId }) : null;
    if (record && req.user!.role === 'patient' && String(record.patientId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (record && req.user!.role === 'doctor') {
      const { hasActiveAccess } = await import('../services/accessService.js');
      const allowed = await hasActiveAccess(String(record.patientId), String(req.user!._id), 'records');
      if (!allowed) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    res.json(tx);
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load transaction.' });
  }
});

export default router;