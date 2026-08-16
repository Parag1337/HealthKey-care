import AccessRequest from '../models/AccessRequest.js';
import { AccessPermission } from '../types/index.js';
import { AccessRequestDocument } from '../types/documents.js';

const isActive = (req: { status: string; expiresAt?: Date; revokedAt?: Date }) =>
  req.status === 'approved' && !req.revokedAt && !!req.expiresAt && req.expiresAt.getTime() > Date.now();

export async function markExpiredRequests(): Promise<void> {
  await AccessRequest.updateMany(
    {
      status: 'approved',
      expiresAt: { $lte: new Date() }
    },
    { $set: { status: 'expired' } }
  );
}

export async function getActiveAccess(
  patientId: string,
  doctorId: string
): Promise<AccessRequestDocument | null> {
  const request = await AccessRequest.findOne({
    patientId,
    doctorId,
    status: 'approved',
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ approvedAt: -1 });

  return request ? (request as AccessRequestDocument) : null;
}

export async function hasActiveAccess(
  patientId: string,
  doctorId: string,
  permission?: AccessPermission
): Promise<boolean> {
  const active = await getActiveAccess(patientId, doctorId);
  if (!active) return false;
  if (permission && !active.permissions[permission]) return false;
  return true;
}

export async function hasPendingRequest(
  patientId: string,
  doctorId: string
): Promise<AccessRequestDocument | null> {
  return AccessRequest.findOne({ patientId, doctorId, status: 'pending' });
}

export { isActive };