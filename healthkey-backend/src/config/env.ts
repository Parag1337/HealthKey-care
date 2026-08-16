import 'dotenv/config';

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET is required. Create a .env file in healthkey-backend with a strong JWT_SECRET value (see .env.example).'
  );
}

export const env = {
  port: readInt('PORT', 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/healthkey',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  qrTokenTtlHours: readInt('QR_TOKEN_TTL_HOURS', 168),
  maxUploadBytes: readInt('MAX_UPLOAD_BYTES', 10 * 1024 * 1024),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || '',
  cloudinarySimulation: process.env.CLOUDINARY_SIMULATION === 'true',
  cloudinarySimFailUploads: process.env.CLOUDINARY_SIM_FAIL_UPLOADS === 'true'
};