import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Availability from '../models/Availability.js';
import { auth, AuthRequest, authorize } from '../middleware/auth.js';
import { detectFileType, sanitizeFilename, storeUpload } from '../services/fileService.js';
import { env } from '../config/env.js';
import { isZodError, zodErrorResponse } from '../utils/apiErrors.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 1 }
});

function profileView(profile: any) {
  return {
    userId: String(profile.userId),
    professionalTitle: profile.professionalTitle,
    specialization: profile.specialization,
    qualifications: profile.qualifications,
    yearsOfExperience: profile.yearsOfExperience,
    registrationNumber: profile.registrationNumber,
    registrationAuthority: profile.registrationAuthority,
    registrationState: profile.registrationState,
    bio: profile.bio,
    photoUrl: profile.photoUrl,
    clinic: profile.clinic,
    consultationFee: profile.consultationFee,
    consultationTypes: profile.consultationTypes,
    verificationStatus: profile.verificationStatus,
    verificationDocs: profile.verificationDocs.map((d: any) => ({
      kind: d.kind,
      originalFilename: d.originalFilename,
      fileSize: d.fileSize,
      uploadedAt: d.uploadedAt
    }))
  };
}

function availabilityView(a: any) {
  return {
    workingDays: a.workingDays || [],
    blockedDates: (a.blockedDates || []).map((d: Date) => new Date(d).toISOString().slice(0, 10))
  };
}

router.get('/', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.user!._id }).lean();
    if (!profile) return res.status(404).json({ message: 'Complete your professional profile first.' });
    const availability = await Availability.findOne({ doctorId: req.user!._id }).lean();
    res.json({ profile: profileView(profile), availability: availability ? availabilityView(availability) : null });
  } catch {
    res.status(500).json({ message: 'Could not load your profile.' });
  }
});

const updateProfileSchema = z.object({
  professionalTitle: z.string().max(20).optional(),
  specialization: z.string().min(2).max(80).optional(),
  qualifications: z.array(z.string().min(1).max(120)).max(8).optional(),
  yearsOfExperience: z.coerce.number().min(0).max(60).optional(),
  registrationNumber: z.string().max(60).optional().or(z.literal('')),
  registrationAuthority: z.string().max(120).optional().or(z.literal('')),
  registrationState: z.string().max(60).optional().or(z.literal('')),
  bio: z.string().max(600).optional().or(z.literal('')),
  photoUrl: z.string().max(300).optional().or(z.literal('')),
  clinicName: z.string().max(120).optional().or(z.literal('')),
  clinicAddress: z.string().max(200).optional().or(z.literal('')),
  clinicPhone: z.string().max(30).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  consultationFee: z.coerce.number().min(0).max(100000).optional(),
  consultationTypes: z.array(z.enum(['in_person', 'online'])).min(1).optional()
});

router.put('/', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const parsed = updateProfileSchema.parse(req.body);
    const profile = await DoctorProfile.findOne({ userId: req.user!._id });
    if (!profile) return res.status(404).json({ message: 'Complete your professional profile first.' });

    if (parsed.specialization) {
      profile.specialization = parsed.specialization;
      await User.updateOne({ _id: req.user!._id }, { $set: { specialization: parsed.specialization } });
    }
    if (parsed.clinicName !== undefined) {
      profile.clinic = {
        ...profile.clinic,
        name: parsed.clinicName || undefined
      };
      await User.updateOne({ _id: req.user!._id }, { $set: { hospital: parsed.clinicName || undefined } });
    }
    if (parsed.clinicAddress !== undefined) {
      profile.clinic = { ...profile.clinic, address: parsed.clinicAddress || undefined };
      await User.updateOne({ _id: req.user!._id }, { $set: { address: parsed.clinicAddress || undefined } });
    }
    if (parsed.clinicPhone !== undefined) profile.clinic = { ...profile.clinic, phone: parsed.clinicPhone || undefined };
    if (parsed.city !== undefined) profile.clinic = { ...profile.clinic, city: parsed.city || undefined };
    if (parsed.professionalTitle !== undefined) profile.professionalTitle = parsed.professionalTitle;
    if (parsed.qualifications !== undefined) profile.qualifications = parsed.qualifications;
    if (parsed.yearsOfExperience !== undefined) profile.yearsOfExperience = parsed.yearsOfExperience;
    if (parsed.registrationNumber !== undefined) profile.registrationNumber = parsed.registrationNumber || undefined;
    if (parsed.registrationAuthority !== undefined) profile.registrationAuthority = parsed.registrationAuthority || undefined;
    if (parsed.registrationState !== undefined) profile.registrationState = parsed.registrationState || undefined;
    if (parsed.bio !== undefined) profile.bio = parsed.bio || undefined;
    if (parsed.photoUrl !== undefined) profile.photoUrl = parsed.photoUrl || undefined;
    if (parsed.consultationFee !== undefined) profile.consultationFee = parsed.consultationFee;
    if (parsed.consultationTypes !== undefined) profile.consultationTypes = parsed.consultationTypes;

    await profile.save();
    res.json({ profile: profileView(profile.toObject()) });
  } catch (err: any) {
    if (isZodError(err)) return zodErrorResponse(res, err);
    res.status(500).json({ message: 'Could not update your profile.' });
  }
});

const availabilitySchema = z.object({
  workingDays: z
    .array(
      z.object({
        day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
        start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        slotDurationMinutes: z.coerce.number().int().min(10).max(120).default(30),
        consultationTypes: z.array(z.enum(['in_person', 'online'])).max(2).optional(),
        breaks: z
          .array(z.object({ start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }))
          .max(6)
          .default([])
      })
    )
    .max(7)
    .default([]),
  blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(120).default([])
});

router.put('/availability', auth, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const parsed = availabilitySchema.parse(req.body);
    const availability = await Availability.findOneAndUpdate(
      { doctorId: req.user!._id },
      {
        $set: {
          workingDays: parsed.workingDays,
          blockedDates: parsed.blockedDates.map((d) => new Date(`${d}T00:00:00Z`))
        }
      },
      { upsert: true, new: true }
    );
    res.json(availabilityView(availability.toObject()));
  } catch (err: any) {
    if (isZodError(err)) return zodErrorResponse(res, err);
    res.status(500).json({ message: 'Could not save your availability.' });
  }
});

router.post(
  '/verification-document',
  auth,
  authorize('doctor'),
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const kind = z
        .enum(['registration_certificate', 'degree', 'identity'])
        .parse(String(req.body.kind || ''));
      if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({ message: 'Please attach a document file.' });
      }
      const detected = detectFileType(req.file.buffer);
      if (!detected) {
        return res
          .status(400)
          .json({ message: 'Unsupported file type. Upload a PDF or image (JPG, PNG, WEBP).' });
      }
      const originalFilename = sanitizeFilename(req.file.originalname || `verification.${detected.extension}`);
      const { storedFilename } = await storeUpload(req.file.buffer, detected);

      const profile = await DoctorProfile.findOne({ userId: req.user!._id });
      if (!profile) {
        return res.status(404).json({ message: 'Complete your professional profile first.' });
      }
      const existingSame = profile.verificationDocs.findIndex((d) => d.kind === kind);
      const doc = {
        kind,
        originalFilename,
        storedFilename,
        mimeType: detected.mimeType,
        fileSize: req.file.size,
        uploadedAt: new Date()
      };
      if (existingSame >= 0) {
        profile.verificationDocs[existingSame] = doc;
      } else {
        profile.verificationDocs.push(doc);
      }
      await profile.save();
      res.json({ message: 'Document uploaded. Verification remains pending until reviewed.', verificationStatus: profile.verificationStatus });
    } catch (err: any) {
      if (isZodError(err)) return zodErrorResponse(res, err);
      res.status(500).json({ message: 'Could not upload the document. Please try again.' });
    }
  }
);

export default router;