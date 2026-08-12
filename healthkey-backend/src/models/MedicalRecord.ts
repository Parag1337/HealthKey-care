import mongoose, { Schema, Document } from 'mongoose';
import { IMedicalRecord } from '../types';

export interface MedicalRecordDocument extends IMedicalRecord, Document {}

const medicalRecordSchema = new Schema<MedicalRecordDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['prescription', 'lab_report', 'scan', 'document'], required: true },
  fileUrl: { type: String, required: true },
  fileName: String,
  notes: String,
  tags: [String],
  blockchainTxId: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<MedicalRecordDocument>('MedicalRecord', medicalRecordSchema);
