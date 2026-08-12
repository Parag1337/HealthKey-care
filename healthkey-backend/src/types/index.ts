import mongoose from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  phone?: string;
  specialization?: string;
  hospital?: string;
  address?: string;
  avatar?: string;
  doctorQR?: string;
  createdAt?: Date;
}

export interface IMedicalRecord {
  patientId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  title: string;
  type: 'prescription' | 'lab_report' | 'scan' | 'document';
  fileUrl: string;
  fileName?: string;
  notes?: string;
  tags?: string[];
  blockchainTxId?: string;
  verified?: boolean;
  createdAt?: Date;
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
  }[];
  notes?: string;
  fileUrl?: string;
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
  status: 'pending' | 'approved' | 'denied';
  expiresAt?: Date;
  grantedAt?: Date;
  createdAt?: Date;
}
