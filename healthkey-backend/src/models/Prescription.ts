import mongoose, { Schema, Document } from 'mongoose';
import { IPrescription } from '../types';

export interface PrescriptionDocument extends IPrescription, Document {}

const prescriptionSchema = new Schema<PrescriptionDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosis: { type: String, required: true },
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: String,
  fileUrl: String,
  blockchainTxId: String,
  aiSummary: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<PrescriptionDocument>('Prescription', prescriptionSchema);
