import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  specialization?: string;
  hospital?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  doctorQR?: string;
}

export interface MedicalRecord {
  _id: string;
  patientId: string;
  uploadedBy: string;
  title: string;
  type: 'prescription' | 'lab_report' | 'scan' | 'document';
  fileUrl: string;
  fileName?: string;
  notes?: string;
  tags?: string[];
  blockchainTxId?: string;
  verified?: boolean;
  createdAt: string;
}

export interface Prescription {
  _id: string;
  patientId: string;
  doctorId: string;
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
  createdAt: string;
}

export interface Vital {
  _id: string;
  patientId: string;
  deviceId?: string;
  heartRate?: number;
  spo2?: number;
  bloodPressure?: string;
  temperature?: number;
  glucose?: number;
  data?: Record<string, any>;
  alertGenerated?: boolean;
  createdAt: string;
}

export interface AccessRequest {
  _id: string;
  patientId: string;
  doctorId: string;
  status: 'pending' | 'approved' | 'denied';
  expiresAt?: string;
  grantedAt?: string;
  createdAt: string;
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['patient', 'doctor']),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  hospital: z.string().optional(),
  address: z.string().optional()
});
