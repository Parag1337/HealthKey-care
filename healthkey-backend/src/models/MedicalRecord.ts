import mongoose, { Schema } from 'mongoose';
import { RECORD_CATEGORIES } from '../constants/index.js';
import { IMedicalRecord } from '../types/index.js';
import type { MedicalRecordDocument } from '../types/documents.js';

const medicalRecordSchema = new Schema<MedicalRecordDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: RECORD_CATEGORIES, required: true },
    originalFilename: { type: String, required: true },
    storedFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    cloudinaryPublicId: String,
    cloudinaryAssetId: String,
    cloudinaryResourceType: String,
    cloudinaryVersion: String,
    cloudinaryFormat: String,
    cloudinaryBytes: Number,
    description: String,
    recordDate: Date,
    sha256Hash: { type: String, required: true },
    blockchainTxId: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export default mongoose.model<MedicalRecordDocument>('MedicalRecord', medicalRecordSchema);