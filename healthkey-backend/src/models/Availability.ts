import mongoose, { Schema } from 'mongoose';

export type WeekDay =
  | 'MON'
  | 'TUE'
  | 'WED'
  | 'THU'
  | 'FRI'
  | 'SAT'
  | 'SUN';

export interface WorkingDay {
  day: WeekDay;
  start: string; // "09:00"
  end: string; // "18:00"
  slotDurationMinutes: number;
  consultationTypes: ('in_person' | 'online')[];
  breaks: { start: string; end: string }[];
}

export interface IAvailabilityDoc {
  doctorId: mongoose.Types.ObjectId;
  workingDays: WorkingDay[];
  blockedDates: Date[];
  createdAt?: Date;
  updatedAt?: Date;
}

const availabilitySchema = new Schema<IAvailabilityDoc>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    workingDays: {
      type: [
        {
          day: { type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], required: true },
          start: { type: String, required: true },
          end: { type: String, required: true },
          slotDurationMinutes: { type: Number, default: 30 },
          consultationTypes: {
            type: [String],
            enum: ['in_person', 'online'],
            default: ['in_person']
          },
          breaks: {
            type: [{ start: String, end: String }],
            default: []
          }
        }
      ],
      default: []
    },
    blockedDates: { type: [Date], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model<IAvailabilityDoc>('Availability', availabilitySchema);