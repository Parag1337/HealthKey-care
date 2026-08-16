import mongoose, { Schema } from 'mongoose';
import { IAuditEvent } from '../types/index.js';
import type { AuditEventDocument } from '../types/documents.js';

const auditEventSchema = new Schema<AuditEventDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, enum: ['patient', 'doctor'], required: true },
    action: { type: String, required: true },
    details: Schema.Types.Mixed
  },
  { timestamps: true }
);

export default mongoose.model<AuditEventDocument>('AuditEvent', auditEventSchema);