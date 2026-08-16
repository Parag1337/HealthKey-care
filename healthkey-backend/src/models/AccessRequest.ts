import mongoose, { Schema } from 'mongoose';
import { IAccessRequest } from '../types/index.js';
import type { AccessRequestDocument } from '../types/documents.js';

const accessRequestSchema = new Schema<AccessRequestDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    permissions: {
      records: { type: Boolean, default: false },
      prescriptions: { type: Boolean, default: false },
      vitals: { type: Boolean, default: false }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'expired', 'revoked'],
      default: 'pending',
      index: true
    },
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approver: { type: Schema.Types.ObjectId, ref: 'User' },
    requestedHours: { type: Number, required: true, min: 1, max: 24 * 30 },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    decidedAt: Date,
    expiresAt: Date,
    revokedAt: Date,
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    qrTokenHash: String
  },
  { timestamps: true }
);

export default mongoose.model<AccessRequestDocument>('AccessRequest', accessRequestSchema);