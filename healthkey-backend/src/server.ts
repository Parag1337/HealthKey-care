import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import recordRoutes from './routes/records.js';
import prescriptionRoutes from './routes/prescriptions.js';
import vitalRoutes from './routes/vitals.js';
import accessRoutes from './routes/access.js';
import doctorRoutes from './routes/doctor.js';
import doctorProfileRoutes from './routes/doctorProfile.js';
import doctorSearchRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import blockchainRoutes from './routes/blockchain.js';
import auditRoutes from './routes/audit.js';
import { env } from './config/env.js';
import { connectMongo, isDbReady } from './config/db.js';
import { requireDb } from './middleware/requireDb.js';
import { ensureUploadDir } from './services/fileService.js';
import { isDuplicateKeyError, isZodError, zodErrorResponse } from './utils/apiErrors.js';

const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: isDbReady() ? 'ok' : 'degraded',
    db: isDbReady() ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});

app.use(requireDb);

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/doctor/profile', doctorProfileRoutes);
app.use('/api/doctors', doctorSearchRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/audit', auditRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err?.name === 'MulterError') {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'This file is larger than the 10 MB limit.'
          : 'Upload failed. Please try again.'
    });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request format.' });
  }
  if (isZodError(err)) {
    return zodErrorResponse(res, err);
  }
  if (isDuplicateKeyError(err)) {
    return res.status(409).json({ message: 'This record already exists.' });
  }
  if (!isDbReady()) {
    return res.status(503).json({
      message: 'HealthKey is temporarily unavailable. Please try again in a moment.'
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
});

async function start() {
  await ensureUploadDir();
  try {
    await connectMongo();
  } catch (err) {
    console.error('Could not start HealthKey backend because MongoDB is unreachable.');
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.error('MongoDB connection lost. Requests will return 503 until reconnected.');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB connection restored.');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  app.listen(env.port, () => console.log(`HealthKey server running on port ${env.port}`));
}

start();