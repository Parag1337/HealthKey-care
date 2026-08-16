import { Request, Response, NextFunction } from 'express';
import { isDbReady } from '../config/db.js';

const EXEMPT_PATHS = ['/api/health'];

export function requireDb(req: Request, res: Response, next: NextFunction) {
  if (EXEMPT_PATHS.includes(req.path)) return next();
  if (!isDbReady()) {
    return res.status(503).json({
      message: 'HealthKey is temporarily unavailable. Please try again in a moment.'
    });
  }
  next();
}