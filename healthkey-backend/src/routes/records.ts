import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import MedicalRecord from '../models/MedicalRecord.js';
import { auth, AuthRequest, authorize } from '../middleware/auth.js';
import { requirePatientAccess, requireRecordAccess } from '../middleware/access.js';
import {
  detectFileType,
  sanitizeFilename,
  storeUpload,
  resolveStoredPath,
  sha256File,
  isPathSafe
} from '../services/fileService.js';
import { blockchainService } from '../services/blockchainService.js';
import { recordAudit, auditActor } from '../services/auditService.js';
import { RECORD_CATEGORIES } from '../constants/index.js';
import { env } from '../config/env.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadBytes,
    files: 1
  }
});

const recordMetaSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: z.enum(RECORD_CATEGORIES),
  description: z.string().trim().max(2000).optional(),
  recordDate: z.string().optional().or(z.date().optional())
});

const patientIdSchema = z.object({
  patientId: z.string().length(24)
});

const asPatientId = (value: any) => z.string().length(24).parse(value);

router.post(
  '/upload',
  auth,
  authorize('patient'),
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({ message: 'No file received. Please attach a PDF or image document.' });
      }

      const validated = recordMetaSchema.parse(req.body);
      const detected = detectFileType(req.file.buffer);
      if (!detected) {
        return res.status(400).json({
          message: 'Unsupported file type. HealthKey accepts PDF, JPG, JPEG, PNG and WEBP documents.'
        });
      }

      const originalFilename = sanitizeFilename(req.file.originalname || `document.${detected.extension}`);
      const { storedFilename, sha256Hash } = await storeUpload(req.file.buffer, detected);

      const record = await MedicalRecord.create({
        patientId: req.user!._id,
        uploadedBy: req.user!._id,
        title: validated.title || originalFilename.replace(/\.[^.]+$/, '').slice(0, 120),
        category: validated.category,
        originalFilename,
        storedFilename,
        mimeType: detected.mimeType,
        fileSize: req.file.size,
        description: validated.description,
        recordDate: validated.recordDate ? new Date(validated.recordDate) : undefined,
        sha256Hash,
        verificationStatus: 'verified'
      });

      const tx = await blockchainService.recordDocumentUpload({
        recordId: String(record._id),
        hash: sha256Hash,
        actorId: String(req.user!._id),
        patientId: String(req.user!._id)
      });

      record.blockchainTxId = tx.txId;
      await record.save();

      await recordAudit({
        patientId: String(req.user!._id),
        ...auditActor(req.user!),
        action: 'document_uploaded',
        details: { recordId: String(record._id), title: record.title, category: record.category }
      });

      const doc = record.toObject();
      delete (doc as any).storedFilename;
      res.status(201).json(doc);
    } catch (err: any) {
      if (err?.name === 'MulterError') {
        return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 10 MB.' : 'Upload failed. Please try again.' });
      }
      if (err?.errors) {
        return res.status(400).json({ message: 'Please provide valid document details.', field: err.errors[0]?.path?.[0] });
      }
      res.status(400).json({ message: err.message || 'Upload failed' });
    }
  }
);

router.get('/my', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user!._id })
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(records.map(serializeRecord));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/patient/:patientId', auth, requirePatientAccess('records'), async (req: AuthRequest, res) => {
  try {
    patientIdSchema.parse(req.params);
    const records = await MedicalRecord.find({ patientId: req.params.patientId })
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(records.map(serializeRecord));
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load records.' });
  }
});

router.get('/:id', auth, requireRecordAccess, async (req: AuthRequest, res) => {
  try {
    res.json(serializeRecord(req.record!));
  } catch (err: any) {
    res.status(500).json({ message: 'Could not load record.' });
  }
});

router.get('/:id/file', auth, requireRecordAccess, async (req: AuthRequest, res) => {
  try {
    const record = req.record!;
    if (!isPathSafe(record.storedFilename)) {
      return res.status(400).json({ message: 'Invalid document reference.' });
    }

    const absolutePath = resolveStoredPath(record.storedFilename);
    const exists = await sha256File(record.storedFilename).catch(() => null);

    if (exists === null) {
      return res.status(404).json({ message: 'Document file is missing on the server.' });
    }

    if (req.user!.role === 'doctor') {
      recordAudit({
        patientId: String(record.patientId),
        ...auditActor(req.user!),
        action: 'document_viewed',
        details: { recordId: String(record._id), title: record.title }
      }).catch(() => {});
      blockchainService
        .recordDocumentAccess({
          recordId: String(record._id),
          hash: record.sha256Hash,
          actorId: String(req.user!._id),
          patientId: String(record.patientId)
        })
        .catch(() => {});
    }

    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Length', String(record.fileSize));
    res.setHeader('Content-Disposition', `inline; filename="${record.originalFilename.replace(/"/g, '')}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(absolutePath);
  } catch (err: any) {
    res.status(500).json({ message: 'Could not serve document.' });
  }
});

router.get('/:id/digest', auth, async (req: AuthRequest, res) => {
  try {
    asPatientId(req.params.id);
    const record = await MedicalRecord.findOne({ _id: req.params.id, patientId: req.user!._id });
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    const current = await sha256File(record.storedFilename).catch(() => null);
    res.json({
      matches: current === record.sha256Hash,
      storedHash: record.sha256Hash,
      currentHash: current ?? 'UNAVAILABLE',
      transaction: record.blockchainTxId
        ? await blockchainService.getTransaction(record.blockchainTxId)
        : null
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Could not verify document.' });
  }
});

function serializeRecord(record: any) {
  const doc = record.toObject ? record.toObject() : record;
  const { storedFilename, ...rest } = doc;
  return rest;
}

export default router;