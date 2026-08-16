import mongoose, { Schema } from 'mongoose';
import { IPrescription } from '../types/index.js';
import type { PrescriptionDocument } from '../types/documents.js';

const prescriptionSchema = new Schema<PrescriptionDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosis: { type: String, required: true, trim: true },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String
      }
    ],
    notes: String,
    integrityHash: String,
    blockchainTxId: String,
    aiSummary: String
  },
  { timestamps: true }
);

export default mongoose.model<PrescriptionDocument>('Prescription', prescriptionSchema);