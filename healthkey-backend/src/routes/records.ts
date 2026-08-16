import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import MedicalRecord from '../models/MedicalRecord.js';
import { auth, AuthRequest, authorize } from '../middleware/auth.js';
import { requirePatientAccess, requireRecordAccess } from '../middleware/access.js';
import { detectFileType, sanitizeFilename } from '../services/fileService.js';
import * as cloudinaryService from '../services/cloudinary.js';
import { blockchainService } from '../services/blockchainService.js';
import { recordAudit, auditActor } from '../services/auditService.js';
import { RECORD_CATEGORIES } from '../constants/index.js';
import { env } from '../config/env.js';
import crypto from 'crypto';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadBytes,
    files: 1
  }
});

const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp']);

function validateExtension(filename: string): boolean {
  const ext = String(filename || '').split('.').pop()?.toLowerCase() || '';
  return ALLOWED_EXTENSIONS.has(ext);
}

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
    let asset: cloudinaryService.CloudinaryAsset | null = null;
    let record: any = null;
    try {
      if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({ message: 'No file received. Please attach a PDF or image document.' });
      }

      const validated = recordMetaSchema.parse(req.body);
      const detected = detectFileType(req.file.buffer);
      if (!detected) {
        return res.status(400).json({
          message: 'Unsupported file type. Please upload a PDF, JPG or PNG.'
        });
      }
      if (!validateExtension(req.file.originalname)) {
        return res.status(400).json({
          message: 'Unsupported file extension. Please upload a PDF, JPG or PNG document.'
        });
      }

      const originalFilename = sanitizeFilename(req.file.originalname || `document.${detected.extension}`);
      const sha256Hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

      asset = await cloudinaryService.uploadDocument({
        buffer: req.file.buffer,
        originalFilename,
        mimeType: detected.mimeType,
        extension: detected.extension,
        patientId: String(req.user!._id)
      });

      record = await MedicalRecord.create({
        patientId: req.user!._id,
        uploadedBy: req.user!._id,
        title: validated.title || originalFilename.replace(/\.[^.]+$/, '').slice(0, 120),
        category: validated.category,
        originalFilename,
        storedFilename: asset.publicId.split('/').pop() || asset.publicId,
        mimeType: detected.mimeType,
        fileSize: req.file.size,
        cloudinaryPublicId: asset.publicId,
        cloudinaryAssetId: asset.assetId,
        cloudinaryResourceType: asset.resourceType,
        cloudinaryVersion: asset.version,
        cloudinaryFormat: asset.format,
        cloudinaryBytes: asset.bytes,
        description: validated.description,
        recordDate: validated.recordDate ? new Date(validated.recordDate) : undefined,
        sha256Hash,
        verificationStatus: 'verified'
      });

      try {
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
      } catch (chainErr: any) {
        await MedicalRecord.deleteOne({ _id: record._id });
        await cloudinaryService.destroyDocument(asset);
        asset = null;
        record = null;
        return res.status(500).json({ message: 'We could not save your document. Please try again.' });
      }

      const doc = record.toObject();
      delete (doc as any).storedFilename;
      delete (doc as any).cloudinarySecureUrl;
      res.status(201).json(doc);
    } catch (err: any) {
      if (asset && record) {
        await cloudinaryService.destroyDocument(asset).catch(() => {});
        await MedicalRecord.deleteOne({ _id: record._id }).catch(() => {});
      } else if (asset) {
        await cloudinaryService.destroyDocument(asset).catch(() => {});
      }
      if (err?.name === 'MulterError') {
        return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'This file is larger than the 10 MB limit.' : 'Upload failed. Please try again.' });
      }
      if (err?.errors) {
        return res.status(400).json({ message: 'Please provide valid document details.', field: err.errors[0]?.path?.[0] });
      }
      if (typeof err?.message === 'string' && /cloudinary|simulated/i.test(err.message)) {
        return res.status(502).json({ message: "We couldn't upload your document. Please try again." });
      }
      if (typeof err?.message === 'string' && /E11000|MongoServerError|ValidationError/i.test(err.message)) {
        return res.status(400).json({ message: "We couldn't save your document. Please try again." });
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

router.get('/asset', async (req: AuthRequest, res) => {
  try {
    const { asset, sig, exp } = req.query as { asset?: string; sig?: string; exp?: string };
    const verified = asset && sig && exp ? cloudinaryService.verifySimSignedReference(asset, sig, exp) : null;
    if (!verified) {
      return res.status(403).json({ message: 'Invalid or expired document link.' });
    }
    const bytes = await cloudinaryService.readSimAssetByPublicId(verified.publicId);
    res.setHeader('Content-Type', cloudinaryService.mimeTypeForFormat(String(verified.publicId.split('.').pop() || '')));
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(bytes);
  } catch (err: any) {
    res.status(404).json({ message: 'Document not found.' });
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
    if (!record.cloudinaryPublicId) {
      return res.status(404).json({ message: 'Document storage reference is missing.' });
    }

    const asset = {
      publicId: record.cloudinaryPublicId,
      assetId: record.cloudinaryAssetId || '',
      resourceType: (record.cloudinaryResourceType === 'raw' ? 'raw' : 'image') as 'image' | 'raw',
      version: record.cloudinaryVersion || '0',
      format: record.cloudinaryFormat || '',
      bytes: record.cloudinaryBytes || record.fileSize
    };

    recordAudit({
      patientId: String(record.patientId),
      ...auditActor(req.user!),
      action: req.query.download === '1' ? 'document_downloaded' : 'document_viewed',
      details: { recordId: String(record._id), title: record.title }
    }).catch(() => {});
    if (req.user!.role === 'doctor') {
      blockchainService
        .recordDocumentAccess({
          recordId: String(record._id),
          hash: record.sha256Hash,
          actorId: String(req.user!._id),
          patientId: String(record.patientId)
        })
        .catch(() => {});
    }

    await cloudinaryService.streamAuthorizedAsset(asset, res, {
      filename: record.originalFilename,
      download: req.query.download === '1',
      mimeType: record.mimeType
    });
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
    if (!record.cloudinaryPublicId) {
      return res.status(404).json({ message: 'Document storage reference is missing.' });
    }
    const current = await cloudinaryService
      .getAssetBytes({
        publicId: record.cloudinaryPublicId,
        assetId: record.cloudinaryAssetId || '',
        resourceType: (record.cloudinaryResourceType === 'raw' ? 'raw' : 'image') as 'image' | 'raw',
        version: record.cloudinaryVersion || '0',
        format: record.cloudinaryFormat || '',
        bytes: record.cloudinaryBytes || record.fileSize
      })
      .then((buf) => crypto.createHash('sha256').update(buf).digest('hex'))
      .catch(() => 'UNAVAILABLE');
    res.json({
      matches: current === record.sha256Hash,
      storedHash: record.sha256Hash,
      currentHash: current,
      transaction: record.blockchainTxId
        ? await blockchainService.getTransaction(record.blockchainTxId)
        : null
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Could not verify document.' });
  }
});

router.delete('/:id', auth, authorize('patient'), async (req: AuthRequest, res) => {
  try {
    asPatientId(req.params.id);
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    if (String(record.patientId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'You do not have permission to delete this record.' });
    }
    if (!record.cloudinaryPublicId) {
      return res.status(409).json({ message: 'This record has no stored document and cannot be deleted.' });
    }

    const asset = {
      publicId: record.cloudinaryPublicId,
      assetId: record.cloudinaryAssetId || '',
      resourceType: (record.cloudinaryResourceType === 'raw' ? 'raw' : 'image') as 'image' | 'raw',
      version: record.cloudinaryVersion || '0',
      format: record.cloudinaryFormat || '',
      bytes: record.cloudinaryBytes || record.fileSize
    };
    try {
      await cloudinaryService.destroyDocument(asset);
    } catch (err: any) {
      return res.status(503).json({
        message: "We couldn't delete the stored document. Please try again."
      });
    }

    await MedicalRecord.deleteOne({ _id: record._id });

    await recordAudit({
      patientId: String(req.user!._id),
      ...auditActor(req.user!),
      action: 'document_deleted',
      details: { recordId: String(record._id), title: record.title, category: record.category }
    }).catch(() => {});

    res.json({ message: 'Record deleted.' });
  } catch (err: any) {
    res.status(500).json({ message: 'Could not delete record.' });
  }
});

function serializeRecord(record: any) {
  const doc = record.toObject ? record.toObject() : record;
  const { storedFilename, cloudinarySecureUrl, ...rest } = doc;
  return rest;
}

export default router;