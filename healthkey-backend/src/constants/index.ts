export const RECORD_CATEGORIES = [
  'prescription',
  'lab_report',
  'diagnostic_report',
  'medical_scan',
  'discharge_summary',
  'consultation_report',
  'other'
] as const;

export const ACCESS_PERMISSIONS = ['records', 'prescriptions', 'vitals'] as const;

export const ACCESS_STATUSES = ['pending', 'approved', 'denied', 'expired', 'revoked'] as const;

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'] as const;

export const QR_TOKEN_TTL_HOURS = 168;