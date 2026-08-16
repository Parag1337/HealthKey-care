import { Document } from 'mongoose';
import {
  IUser,
  IMedicalRecord,
  IPrescription,
  IVital,
  IAccessRequest,
  IAuditEvent,
  IBlockchainTransaction,
  IPatientProfile,
  IDoctorProfile,
  IAvailability,
  IAppointment
} from './index.js';

export interface UserDocument extends IUser, Document {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface MedicalRecordDocument extends IMedicalRecord, Document {}

export interface PrescriptionDocument extends IPrescription, Document {}

export interface VitalDocument extends IVital, Document {}

export interface AccessRequestDocument extends IAccessRequest, Document {}

export interface AuditEventDocument extends IAuditEvent, Document {}

export interface BlockchainTransactionDocument extends IBlockchainTransaction, Document {}

export interface PatientProfileDocument extends IPatientProfile, Document {}

export interface DoctorProfileDocument extends IDoctorProfile, Document {}

export interface AvailabilityDocument extends IAvailability, Document {}

export interface AppointmentDocument extends IAppointment, Document {}