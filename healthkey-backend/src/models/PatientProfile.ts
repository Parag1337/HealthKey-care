import mongoose, { Schema } from 'mongoose';

export interface IPatientProfileDoc {
  userId: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  sex?: 'male' | 'female' | 'other';
  gender?: string;
  city?: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const patientProfileSchema = new Schema<IPatientProfileDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dateOfBirth: Date,
    sex: { type: String, enum: ['male', 'female', 'other'] },
    gender: String,
    city: String,
    bloodGroup: String,
    allergies: [String],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  { timestamps: true }
);

export default mongoose.model<IPatientProfileDoc>('PatientProfile', patientProfileSchema);