import mongoose, { Schema } from 'mongoose';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type AppointmentType = 'in_person' | 'online';

export interface IAppointmentDoc {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentType: AppointmentType;
  date: string; // YYYY-MM-DD
  startTime: string; // "09:30"
  endTime: string; // "10:00"
  slotKey: string; // `${doctorId}:${date}:${startTime}` unique
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  previousSlotKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const appointmentSchema = new Schema<IAppointmentDoc>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentType: { type: String, enum: ['in_person', 'online'], required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotKey: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'],
      default: 'pending'
    },
    reason: String,
    notes: String,
    cancelledAt: Date,
    cancellationReason: String,
    previousSlotKey: String
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, date: 1, startTime: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });

export default mongoose.model<IAppointmentDoc>('Appointment', appointmentSchema);