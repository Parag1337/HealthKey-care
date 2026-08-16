import mongoose, { Schema } from 'mongoose';
import { IBlockchainTransaction } from '../types/index.js';
import type { BlockchainTransactionDocument } from '../types/documents.js';

const blockchainTransactionSchema = new Schema<BlockchainTransactionDocument>(
  {
    txId: { type: String, required: true, unique: true, index: true },
    action: {
      type: String,
      enum: ['document_upload', 'access_request', 'access_approval', 'access_revocation', 'document_access'],
      required: true
    },
    hash: String,
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User' },
    recordId: { type: Schema.Types.ObjectId, ref: 'MedicalRecord' },
    requestId: { type: Schema.Types.ObjectId, ref: 'AccessRequest' },
    details: String,
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['recorded', 'verified', 'failed'], default: 'recorded' }
  },
  { timestamps: true }
);

export default mongoose.model<BlockchainTransactionDocument>(
  'BlockchainTransaction',
  blockchainTransactionSchema
);