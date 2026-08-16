import { Response, NextFunction } from 'express';
import MedicalRecord from '../models/MedicalRecord.js';
import { AuthRequest } from './auth.js';
import { AccessPermission } from '../types/index.js';
import { hasActiveAccess } from '../services/accessService.js';

export const requirePatientAccess = (permission: AccessPermission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const patientId = req.params.patientId || (req.body && req.body.patientId);

      if (user.role === 'patient' && String(user._id) === String(patientId)) {
        return next();
      }

      if (user.role === 'doctor' && patientId) {
        const allowed = await hasActiveAccess(String(patientId), String(user._id), permission);
        if (allowed) {
          return next();
        }
      }

      return res.status(403).json({
        message:
          'Access denied. This content is not included in your current consent, or your consent has expired or been revoked. Request access again to continue.'
      });
    } catch (err) {
      return res.status(403).json({ message: 'Access denied.' });
    }
  };
};

export const requireRecordAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const recordId = req.params.id || req.params.recordId;
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (user.role === 'patient' && String(record.patientId) === String(user._id)) {
      req.record = record;
      return next();
    }

    if (user.role === 'doctor') {
      const allowed = await hasActiveAccess(String(record.patientId), String(user._id), 'records');
      if (allowed) {
        req.record = record;
        return next();
      }
    }

    return res.status(403).json({
      message:
        'Access denied. You do not have active consent to view this document. Request access again to continue.'
    });
  } catch {
    return res.status(403).json({ message: 'Access denied.' });
  }
};

export { MedicalRecord };