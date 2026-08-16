import axios, { AxiosError } from 'axios';
import {
  AccessRequest,
  Appointment,
  AppointmentType,
  AuditEvent,
  AvailabilitySettings,
  BlockchainTx,
  DoctorCard,
  DoctorProfileView,
  DoctorRegisterPayload,
  MedicalRecord,
  PatientRegisterPayload,
  Prescription,
  QrCodeInfo,
  ResolveQrResult,
  SlotsResponse,
  User,
  VerificationResult,
  Vital
} from '../types';

export type { DoctorRegisterPayload, PatientRegisterPayload } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; fieldErrors?: Record<string, string> }
      | undefined;
    const firstFieldError = data?.fieldErrors ? Object.values(data.fieldErrors)[0] : undefined;
    if (firstFieldError) return firstFieldError;
    if (
      error.response?.status === 401 &&
      /session|token|expired|sign in/i.test(data?.message || '') &&
      !error.config?.url?.includes('/auth/login')
    ) {
      return 'Your session has expired. Please sign in again.';
    }
    if (error.response?.status === 403 && data?.message === 'Not authorized to access this route') {
      return 'You do not have permission to access this page.';
    }
    if (data?.message) return data.message;
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check your connection and try again.';
    }
  }
  return fallback;
}

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post<{ token: string; user: User }>('/auth/login', data),
  register: (data: Partial<User> & { password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  registerPatient: (data: PatientRegisterPayload) =>
    api.post<{ token: string; user: User }>('/auth/patient/register', data),
  registerDoctor: (data: DoctorRegisterPayload) =>
    api.post<{ token: string; user: User; verificationStatus: string }>('/auth/doctor/register', data),
  getMe: () => api.get<User>('/auth/me')
};

export interface DoctorSearchParams {
  q?: string;
  specialty?: string;
  city?: string;
  type?: AppointmentType;
  maxFee?: number;
  minYears?: number;
  verifiedOnly?: boolean;
  limit?: number;
}

export const doctorSearchAPI = {
  search: (params?: DoctorSearchParams) =>
    api.get<DoctorCard[]>('/doctors', { params: { ...params, verifiedOnly: params?.verifiedOnly ? 'true' : undefined } }),
  getSpecialities: () => api.get<string[]>('/doctors/specialties'),
  getById: (id: string) => api.get<DoctorCard>(`/doctors/${id}`),
  getAvailability: (id: string, date: string, type: AppointmentType = 'in_person') =>
    api.get<SlotsResponse>(`/doctors/${id}/availability`, { params: { date, type } })
};

export const doctorProfileAPI = {
  getProfile: () => api.get<{ profile: DoctorProfileView; availability: AvailabilitySettings | null }>('/doctor/profile'),
  updateAvailability: (data: AvailabilitySettings) =>
    api.put<AvailabilitySettings>('/doctor/profile/availability', data),
  uploadVerificationDocument: (kind: string, file: File) => {
    const form = new FormData();
    form.append('kind', kind);
    form.append('file', file);
    return api.post<{ verificationStatus: string }>('/doctor/profile/verification-document', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export interface BookAppointmentInput {
  doctorId: string;
  date: string;
  startTime: string;
  appointmentType: AppointmentType;
  reason?: string;
  notes?: string;
}

export const appointmentsAPI = {
  book: (data: BookAppointmentInput) => api.post<Appointment>('/appointments', data),
  list: (params?: { scope?: 'upcoming' | 'past'; status?: string; date?: string }) =>
    api.get<Appointment[]>('/appointments', { params }),
  cancel: (id: string, reason?: string) => api.patch<Appointment>(`/appointments/${id}/cancel`, { reason }),
  reschedule: (
    id: string,
    data: { date: string; startTime: string; appointmentType?: AppointmentType }
  ) => api.patch<Appointment>(`/appointments/${id}/reschedule`, data),
  setStatus: (id: string, data: { status: 'confirmed' | 'completed' | 'no_show' | 'cancelled'; reason?: string }) =>
    api.patch<Appointment>(`/appointments/${id}/status`, data)
};

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export const recordsAPI = {
  upload: (formData: FormData, onProgress?: (p: UploadProgress) => void) =>
    api.post<MedicalRecord>('/records/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress({ percent: Math.round((e.loaded / e.total) * 100), loaded: e.loaded, total: e.total });
        }
      }
    }),
  getMyRecords: () => api.get<MedicalRecord[]>('/records/my'),
  getPatientRecords: (patientId: string) => api.get<MedicalRecord[]>(`/records/patient/${patientId}`),
  getRecord: (id: string) => api.get<MedicalRecord>(`/records/${id}`),
  getFileBlob: (id: string, download = false) =>
    api.get<Blob>(`/records/${id}/file`, {
      params: download ? { download: 1 } : {},
      responseType: 'blob'
    }),
  deleteRecord: (id: string) => api.delete<{ message: string }>(`/records/${id}`),
  getDigest: (id: string) =>
    api.get<{ matches: boolean; storedHash: string; currentHash: string; transaction: BlockchainTx | null }>(
      `/records/${id}/digest`
    )
};

export interface RequestAccessInput {
  doctorId?: string;
  qrToken?: string;
  permissions: { records: boolean; prescriptions: boolean; vitals: boolean };
  requestedHours: number;
}

export const accessAPI = {
  request: (data: RequestAccessInput) => api.post<AccessRequest>('/access/request', data),
  getMyRequests: () => api.get<AccessRequest[]>('/access/my'),
  getDoctorRequests: () => api.get<AccessRequest[]>('/access/doctor'),
  getActive: () => api.get<AccessRequest[]>('/access/active'),
  approve: (id: string) => api.patch<AccessRequest>(`/access/${id}/approve`),
  deny: (id: string) => api.patch<AccessRequest>(`/access/${id}/deny`),
  revoke: (id: string) => api.patch<AccessRequest>(`/access/${id}/revoke`),
  cancel: (id: string) => api.delete(`/access/${id}`)
};

export const doctorAPI = {
  getMyQr: () => api.get<QrCodeInfo>('/doctor/qr'),
  regenerateQr: () => api.post<QrCodeInfo>('/doctor/qr/regenerate'),
  resolveQr: (token: string) => api.post<ResolveQrResult>('/doctor/resolve-qr', { token })
};

export const prescriptionsAPI = {
  create: (data: {
    patientId: string;
    diagnosis: string;
    medicines: { name: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }[];
    notes?: string;
  }) => api.post<Prescription>('/prescriptions/create', data),
  getMyPrescriptions: () => api.get<Prescription[]>('/prescriptions/my'),
  getDoctorPrescriptions: () => api.get<Prescription[]>('/prescriptions/doctor/my'),
  getPatientPrescriptions: (patientId: string) => api.get<Prescription[]>(`/prescriptions/patient/${patientId}`)
};

export const vitalsAPI = {
  ingest: (data: Partial<Vital>) => api.post<Vital>('/vitals/ingest', data),
  getMyVitals: () => api.get<Vital[]>('/vitals/my'),
  getPatientVitals: (patientId: string) => api.get<Vital[]>(`/vitals/patient/${patientId}`)
};

export const auditAPI = {
  getMyAudit: () => api.get<AuditEvent[]>('/audit/my')
};

export const blockchainAPI = {
  verifyRecord: (recordId: string) => api.post<VerificationResult>(`/blockchain/verify/${recordId}`),
  getTransaction: (txId: string) => api.get<BlockchainTx>(`/blockchain/tx/${txId}`)
};