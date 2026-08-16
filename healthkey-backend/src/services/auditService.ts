import AuditEvent from '../models/AuditEvent.js';
import { IAuditEvent } from '../types/index.js';

export type AuditAction =
  | 'access_requested'
  | 'access_approved'
  | 'access_denied'
  | 'access_revoked'
  | 'document_uploaded'
  | 'document_viewed'
  | 'document_downloaded'
  | 'document_deleted'
  | 'prescription_created'
  | 'appointment_booked'
  | 'appointment_cancelled'
  | 'appointment_rescheduled';

export interface AuditInput {
  patientId: string;
  doctorId?: string;
  actorId: string;
  actorName: string;
  actorRole: 'patient' | 'doctor';
  action: AuditAction;
  details?: Record<string, unknown>;
}

export async function recordAudit(input: AuditInput): Promise<IAuditEvent> {
  return AuditEvent.create({
    patientId: input.patientId,
    doctorId: input.doctorId,
    actorId: input.actorId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    action: input.action,
    details: input.details
  });
}

export async function getPatientAuditEvents(patientId: string, limit = 50): Promise<IAuditEvent[]> {
  return AuditEvent.find({ patientId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export function auditActor(user: { _id: any; name: string; role: 'patient' | 'doctor' }) {
  return {
    actorId: String(user._id),
    actorName: user.name,
    actorRole: user.role
  };
}