import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { MedicalRecordDocument } from '../types/documents.js';

export interface AuthRequest extends Request {
  user?: any;
  record?: MedicalRecordDocument;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId)
      .select('-password -qrTokenHash -qrTokenCipher')
      .lean();
    if (!user) {
      return res.status(401).json({ message: 'Session is no longer valid. Please sign in again.' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired or invalid. Please sign in again.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || '')) {
      return res.status(403).json({ message: 'Not authorized to access this route' });
    }
    next();
  };
};