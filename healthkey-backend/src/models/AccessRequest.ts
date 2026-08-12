import mongoose, { Schema, Document } from 'mongoose';
import { IAccessRequest } from '../types';

export interface AccessRequestDocument extends IAccessRequest, Document {}

const accessRequestSchema = new Schema<AccessRequestDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  expiresAt: Date,
  grantedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<AccessRequestDocument>('AccessRequest', accessRequestSchema);
