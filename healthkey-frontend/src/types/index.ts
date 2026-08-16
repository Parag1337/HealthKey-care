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

export type AccessPermissionKey = 'records' | 'prescriptions' | 'vitals';

export interface AccessPermissions {
  records: boolean;
  prescriptions: boolean;
  vitals: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialization?: string;
  hospital?: string;
  phone?: string;
  address?: string;
}

export interface MedicalRecord {
  _id: string;
  patientId: string;
  uploadedBy: string;
  title: string;
  category: RecordCategory;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  description?: string;
  recordDate?: string;
  sha256Hash: string;
  blockchainTxId?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  uploadedByInfo?: { name: string; role: Role };
  createdAt: string;
  updatedAt: string;
}

export interface Medicine {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface Prescription {
  _id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  medicines: Medicine[];
  notes?: string;
  integrityHash?: string;
  blockchainTxId?: string;
  aiSummary?: string;
  doctor?: { name: string; specialization?: string; hospital?: string };
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
  data?: Record<string, unknown>;
  alertGenerated?: boolean;
  createdAt: string;
}

export interface AccessRequest {
  _id: string;
  patientId: string;
  doctorId: string;
  permissions: AccessPermissions;
  status: AccessStatus;
  requester?: string;
  approver?: string;
  requestedHours: number;
  requestedAt: string;
  approvedAt?: string;
  decidedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  createdAt: string;
  doctor?: { name: string; specialization?: string; hospital?: string };
  patient?: { name: string; email: string };
}

export interface AuditEvent {
  _id: string;
  patientId: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  details?: Record<string, string | number | boolean | null | undefined>;
  createdAt: string;
}

export interface BlockchainTx {
  txId: string;
  action: string;
  hash?: string;
  actorId: string;
  patientId?: string;
  recordId?: string;
  requestId?: string;
  details?: string;
  timestamp: string;
  status: string;
}

export interface VerificationResult {
  recordId: string;
  title: string;
  storedHash: string;
  currentHash: string;
  matches: boolean;
  transaction: BlockchainTx | null;
  uploadedAt: string;
}

export interface QrCodeInfo {
  token: string;
  payload: string;
  expiresAt: string;
}

export interface ResolvedDoctor {
  id: string;
  name: string;
  specialization?: string;
  hospital?: string;
}

export interface ResolveQrResult {
  doctor: ResolvedDoctor;
  hasActiveAccess: boolean;
  hasPendingRequest: boolean;
}

export const RECORD_CATEGORY_LABELS: Record<RecordCategory, string> = {
  prescription: 'Prescription',
  lab_report: 'Laboratory Report',
  diagnostic_report: 'Diagnostic Report',
  medical_scan: 'Medical Scan',
  discharge_summary: 'Discharge Summary',
  consultation_report: 'Consultation Report',
  other: 'Other'
};

export const RECORD_CATEGORY_OPTIONS = Object.entries(RECORD_CATEGORY_LABELS).map(([value, label]) => ({
  value: value as RecordCategory,
  label
}));

export const PERMISSION_LABELS: Record<AccessPermissionKey, string> = {
  records: 'Medical Records',
  prescriptions: 'Prescriptions',
  vitals: 'Vitals'
};

export const PERMISSION_KEYS: AccessPermissionKey[] = ['records', 'prescriptions', 'vitals'];

export const DURATION_OPTIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 6, label: '6 hours' },
  { hours: 24, label: '24 hours' },
  { hours: 168, label: '7 days' }
];

export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
  expired: 'Expired',
  revoked: 'Revoked'
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type DayCode = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type AppointmentType = 'in_person' | 'online';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export interface WorkingDayInput {
  day: DayCode;
  start: string;
  end: string;
  slotDurationMinutes?: number;
  consultationTypes?: AppointmentType[];
  breaks?: { start: string; end: string }[];
}

export interface AvailabilitySettings {
  workingDays: WorkingDayInput[];
  blockedDates: string[];
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface SlotsResponse {
  date: string;
  weekday: DayCode;
  slots: TimeSlot[];
}

export interface DoctorClinic {
  name?: string;
  address?: string;
  city?: string;
}

export interface DoctorCard {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  professionalTitle?: string;
  qualifications?: string[];
  yearsOfExperience?: number;
  registrationNumber?: string;
  registrationState?: string;
  bio?: string;
  photoUrl?: string;
  clinic?: DoctorClinic | null;
  consultationFee?: number;
  consultationTypes?: AppointmentType[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  nextAvailable?: TimeSlot | null;
}

export interface PatientProfile {
  city?: string;
  sex?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies?: string[];
}

export interface DoctorProfileView {
  professionalTitle?: string;
  specialization?: string;
  qualifications?: string[];
  yearsOfExperience?: number;
  registrationNumber?: string;
  registrationState?: string;
  bio?: string;
  photoUrl?: string;
  clinic?: DoctorClinic | null;
  consultationFee?: number;
  consultationTypes?: AppointmentType[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  hasVerificationDocs?: boolean;
  verificationDocs?: { kind: string; fileName: string; uploadedAt: string }[];
  availability?: AvailabilitySettings | null;
}

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentType: AppointmentType;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  previousSlotKey?: string;
  slotKey?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  doctor?: { name: string; specialization?: string; hospital?: string };
  patient?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface PatientRegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  profile?: { city?: string; sex?: string; dateOfBirth?: string; bloodGroup?: string; allergies?: string[] };
}

export interface DoctorRegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  professional?: {
    professionalTitle?: string;
    specialization?: string;
    qualifications?: string[];
    yearsOfExperience?: number;
    registrationNumber?: string;
    registrationState?: string;
  };
  practice?: {
    clinicName?: string;
    clinicAddress?: string;
    city?: string;
    consultationFee?: number;
    consultationTypes?: AppointmentType[];
    workingDays?: WorkingDayInput[];
  };
}

export const DAY_LABELS: Record<DayCode, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday'
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  rescheduled: 'Rescheduled'
};

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  in_person: 'In-person',
  online: 'Online'
};