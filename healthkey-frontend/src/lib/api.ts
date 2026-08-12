import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) =>
    api.post('/auth/register', data),
  getMe: () =>
    api.get('/auth/me')
};

export const recordsAPI = {
  upload: (formData: FormData) =>
    api.post('/records/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getMyRecords: () =>
    api.get('/records/my'),
  getPatientRecords: (patientId: string) =>
    api.get(`/records/patient/${patientId}`)
};

export const prescriptionsAPI = {
  create: (data: any) =>
    api.post('/prescriptions/create', data),
  getMyPrescriptions: () =>
    api.get('/prescriptions/my'),
  getPatientPrescriptions: (patientId: string) =>
    api.get(`/prescriptions/patient/${patientId}`)
};

export const vitalsAPI = {
  ingest: (data: any) =>
    api.post('/vitals/ingest', data),
  getMyVitals: () =>
    api.get('/vitals/my'),
  getPatientVitals: (patientId: string) =>
    api.get(`/vitals/patient/${patientId}`)
};

export const accessAPI = {
  request: (data: { doctorId: string }) =>
    api.post('/access/request', data),
  getMyRequests: () =>
    api.get('/access/my'),
  getDoctorRequests: () =>
    api.get('/access/doctor'),
  approve: (id: string, expiresInHours?: number) =>
    api.patch(`/access/${id}/approve`, { expiresInHours }),
  deny: (id: string) =>
    api.patch(`/access/${id}/deny`)
};

export const blockchainAPI = {
  verifyRecord: (recordId: string) =>
    api.post(`/blockchain/record/${recordId}`),
  verifyTx: (txId: string) =>
    api.get(`/blockchain/verify/${txId}`)
};
