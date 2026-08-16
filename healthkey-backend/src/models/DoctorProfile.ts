import mongoose, { Schema } from 'mongoose';

export type DoctorVerificationStatus = 'pending' | 'verified' | 'suspended';

export interface VerificationDoc {
  kind: 'registration_certificate' | 'degree' | 'identity';
  originalFilename: string;
  storedFilename?: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
  cloudinaryPublicId?: string;
  cloudinaryAssetId?: string;
  cloudinaryResourceType?: string;
  cloudinaryVersion?: string;
  cloudinaryFormat?: string;
  cloudinaryBytes?: number;
}

export interface IDoctorProfileDoc {
  userId: mongoose.Types.ObjectId;
  professionalTitle: string;
  specialization: string;
  qualifications: string[];
  yearsOfExperience: number;
  registrationNumber?: string;
  registrationAuthority?: string;
  registrationState?: string;
  bio?: string;
  photoUrl?: string;
  clinic?: {
    name?: string;
    address?: string;
    city?: string;
    phone?: string;
  };
  consultationFee: number;
  consultationTypes: ('in_person' | 'online')[];
  verificationStatus: DoctorVerificationStatus;
  verificationDocs: VerificationDoc[];
  createdAt?: Date;
  updatedAt?: Date;
}

const doctorProfileSchema = new Schema<IDoctorProfileDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    professionalTitle: { type: String, default: 'Dr.' },
    specialization: { type: String, required: true, default: 'General Medicine' },
    qualifications: { type: [String], default: [] },
    yearsOfExperience: { type: Number, default: 0 },
    registrationNumber: String,
    registrationAuthority: String,
    registrationState: String,
    bio: String,
    photoUrl: String,
    clinic: {
      name: String,
      address: String,
      city: String,
      phone: String
    },
    consultationFee: { type: Number, default: 0 },
    consultationTypes: {
      type: [String],
      enum: ['in_person', 'online'],
      default: ['in_person']
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'suspended'],
      default: 'pending'
    },
    verificationDocs: {
      type: [
        {
          kind: { type: String, enum: ['registration_certificate', 'degree', 'identity'] },
          originalFilename: String,
          storedFilename: String,
          mimeType: String,
          fileSize: Number,
          uploadedAt: { type: Date, default: Date.now },
          cloudinaryPublicId: String,
          cloudinaryAssetId: String,
          cloudinaryResourceType: String,
          cloudinaryVersion: String,
          cloudinaryFormat: String,
          cloudinaryBytes: Number
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model<IDoctorProfileDoc>('DoctorProfile', doctorProfileSchema);