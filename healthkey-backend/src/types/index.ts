import mongoose from 'mongoose';

export type Role = 'patient' | 'doctor';

export type RecordCategory =
  | 'prescription'
  | 'lab_report'
  | 'diagnostic_report'
  | 'medical_scan'
  | 'discharge_summary'
  | 'consultation_report'
  | 'other';

export type AccessStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'revoked';

export type AccessPermission = 'records' | 'prescriptions' | 'vitals';

export interface AccessPermissions {
  records: boolean;
  prescriptions: boolean;
  vitals: boolean;
}

export type VerificationStatus = 'pending' | 'verified' | 'failed';

export type BlockchainAction =
  | 'document_upload'
  | 'access_request'
  | 'access_approval'
  | 'access_revocation'
  | 'document_access';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  specialization?: string;
  hospital?: string;
  address?: string;
  avatar?: string;
  qrTokenHash?: string;
  qrTokenCipher?: string;
  qrTokenExpiresAt?: Date;
  createdAt?: Date;
}

export type DoctorVerificationStatus = 'pending' | 'verified' | 'suspended';

export interface IPatientProfile {
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

export interface IDoctorProfile {
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
  verificationDocs: {
    kind: 'registration_certificate' | 'degree' | 'identity';
    originalFilename: string;
    storedFilename: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface IAvailability {
  doctorId: mongoose.Types.ObjectId;
  workingDays: {
    day: WeekDay;
    start: string;
    end: string;
    slotDurationMinutes: number;
    consultationTypes: ('in_person' | 'online')[];
    breaks: { start: string; end: string }[];
  }[];
  blockedDates: Date[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface IAppointment {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentType: 'in_person' | 'online';
  date: string;
  startTime: string;
  endTime: string;
  slotKey: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  previousSlotKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMedicalRecord {
  patientId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  title: string;
  category: RecordCategory;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  description?: string;
  recordDate?: Date;
  sha256Hash: string;
  blockchainTxId?: string;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrescription {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  diagnosis: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  notes?: string;
  integrityHash?: string;
  blockchainTxId?: string;
  aiSummary?: string;
  createdAt?: Date;
}

export interface IVital {
  patientId: mongoose.Types.ObjectId;
  deviceId?: string;
  heartRate?: number;
  spo2?: number;
  bloodPressure?: string;
  temperature?: number;
  glucose?: number;
  data?: Record<string, any>;
  alertGenerated?: boolean;
  createdAt?: Date;
}

export interface IAccessRequest {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  permissions: AccessPermissions;
  status: AccessStatus;
  requester: mongoose.Types.ObjectId;
  approver?: mongoose.Types.ObjectId;
  requestedHours: number;
  requestedAt: Date;
  approvedAt?: Date;
  decidedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  qrTokenHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAuditEvent {
  patientId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: Role;
  action: string;
  details?: Record<string, any>;
  createdAt?: Date;
}

export interface IBlockchainTransaction {
  txId: string;
  action: BlockchainAction;
  hash?: string;
  actorId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  recordId?: mongoose.Types.ObjectId;
  requestId?: mongoose.Types.ObjectId;
  details?: string;
  timestamp: Date;
  status: 'recorded' | 'verified' | 'failed';
}

export interface BlockchainTx {
  txId: string;
  action: BlockchainAction;
  hash?: string;
  actorId: string;
  patientId?: string;
  recordId?: string;
  requestId?: string;
  details?: string;
  timestamp: Date;
  status: 'recorded' | 'verified' | 'failed';
}