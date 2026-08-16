import { Response } from 'express';
import { ZodError } from 'zod';
import { isDbReady } from '../config/db.js';

export function isZodError(err: any): err is ZodError {
  return err instanceof ZodError || (err && typeof err.issues === 'function');
}

export function zodErrorResponse(res: Response, err: ZodError): Response {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path?.[0] ?? 'form');
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return res.status(400).json({
    message: 'Please check the highlighted fields and try again.',
    fieldErrors
  });
}

export function isDuplicateKeyError(err: any): boolean {
  return err?.code === 11000;
}

export function isDbConnectionError(err: any): boolean {
  return (
    !isDbReady() &&
    (err?.name === 'MongooseServerSelectionError' ||
      err?.name === 'MongoNetworkError' ||
      err?.code === 8000 ||
      err?.name === 'MongoNotConnectedError')
  );
}