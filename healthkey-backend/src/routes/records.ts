import express from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import MedicalRecord from '../models/MedicalRecord';
import { auth, AuthRequest, authorize } from '../middleware/auth';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

const recordSchema = z.object({
  title: z.string(),
  type: z.enum(['prescription', 'lab_report', 'scan', 'document']),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

router.post('/upload', auth, authorize('patient', 'doctor'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const validated = recordSchema.parse(req.body);
    const record = await MedicalRecord.create({
      ...validated,
      patientId: req.user!._id,
      uploadedBy: req.user!._id,
      fileUrl: req.file?.path || ''
    });
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Upload failed' });
  }
});

router.get('/patient/:patientId', auth, async (req: AuthRequest, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.params.patientId }).populate('uploadedBy', 'name role');
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', auth, async (req: AuthRequest, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user!._id }).populate('uploadedBy', 'name role');
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
