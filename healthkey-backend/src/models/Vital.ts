import mongoose, { Schema, Document } from 'mongoose';
import { IVital } from '../types';

export interface VitalDocument extends IVital, Document {}

const vitalSchema = new Schema<VitalDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: String,
  heartRate: Number,
  spo2: Number,
  bloodPressure: String,
  temperature: Number,
  glucose: Number,
  data: Schema.Types.Mixed,
  alertGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<VitalDocument>('Vital', vitalSchema);
