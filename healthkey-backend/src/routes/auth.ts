import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Availability from '../models/Availability.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { isDbReady } from '../config/db.js';
import { isDuplicateKeyError, isZodError, zodErrorResponse } from '../utils/apiErrors.js';

const router = express.Router();

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const accountFields = {
  name: z.string().min(2, 'Please enter at least 2 characters.').max(80),
  email: z.string().email('Please enter a valid email address.'),
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(128)
};


const patientProfileSchema = z.object({
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
    .optional()
    .or(z.literal('')),
  sex: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  gender: z.string().max(40).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  bloodGroup: z.string().max(10).optional().or(z.literal('')),
  allergies: z.array(z.string().max(80)).max(20).optional(),
  emergencyContact: z
    .object({
      name: z.string().max(80).optional(),
      phone: z.string().max(30).optional(),
      relationship: z.string().max(40).optional()
    })
    .optional()
});

const patientRegisterSchema = z
  .object({
    ...accountFields,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    profile: patientProfileSchema.optional()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  });

const doctorRegisterSchema = z
  .object({
    ...accountFields,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    professional: z
      .object({
        professionalTitle: z.string().max(20).default('Dr.'),
        specialization: z.string().max(80).default('General Medicine'),
        qualifications: z.array(z.string().min(1).max(120)).max(8).default([]),
        yearsOfExperience: z.coerce.number().min(0).max(60).default(0),
        registrationNumber: z.string().max(60).optional().or(z.literal('')),
        registrationAuthority: z.string().max(120).optional().or(z.literal('')),
        registrationState: z.string().max(60).optional().or(z.literal('')),
        bio: z.string().max(600).optional().or(z.literal('')),
        photoUrl: z.string().max(300).optional().or(z.literal(''))
      })
      .default({
        professionalTitle: 'Dr.',
        specialization: 'General Medicine',
        qualifications: [],
        yearsOfExperience: 0,
        registrationNumber: '',
        registrationAuthority: '',
        registrationState: '',
        bio: '',
        photoUrl: ''
      }),
    practice: z
      .object({
        clinicName: z.string().max(120).optional().or(z.literal('')),
        clinicAddress: z.string().max(200).optional().or(z.literal('')),
        clinicPhone: z.string().max(30).optional().or(z.literal('')),
        city: z.string().max(80).optional().or(z.literal('')),
        consultationFee: z.coerce.number().min(0).max(100000).default(0),
        consultationTypes: z
          .array(z.enum(['in_person', 'online']))
          .max(2)
          .default(['in_person']),
        workingDays: z
          .array(
            z.object({
              day: z.enum(WEEK_DAYS),
              start: z.string().regex(TIME_RE, 'Use HH:MM format.'),
              end: z.string().regex(TIME_RE, 'Use HH:MM format.'),
              slotDurationMinutes: z.coerce.number().int().min(10).max(120).default(30),
              consultationTypes: z.array(z.enum(['in_person', 'online'])).max(2).optional(),
              breaks: z
                .array(z.object({ start: z.string().regex(TIME_RE), end: z.string().regex(TIME_RE) }))
                .max(6)
                .default([])
            })
          )
          .max(7)
          .default([])
      })
      .default({
        clinicName: '',
        clinicAddress: '',
        clinicPhone: '',
        city: '',
        consultationFee: 0,
        consultationTypes: ['in_person'],
        workingDays: []
      })
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  });


const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.')
});

const generateToken = (id: string) =>
  jwt.sign({ userId: id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn']
  });

const publicUser = (user: any) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  specialization: user.specialization,
  hospital: user.hospital,
  phone: user.phone,
  address: user.address
});

const dbUnavailable = () => ({
  message: 'We could not connect to HealthKey. Please try again in a moment.'
});

async function registerDoctorAccount(validated: any) {
  const email = validated.email.toLowerCase();
  if (await User.findOne({ email })) {
    const error: any = new Error('email_taken');
    error.code = 409;
    throw error;
  }
  const prof = validated.professional || {};
  const practice = validated.practice || {};
  const specialization = prof.specialization || 'General Medicine';

  const user = await User.create({
    name: prof.professionalTitle
      ? `${prof.professionalTitle} ${validated.name}`.replace(/^Dr\. Dr\./, 'Dr.')
      : validated.name,
    email,
    password: validated.password,
    role: 'doctor',
    phone: validated.phone || undefined,
    specialization,
    hospital: practice.clinicName || undefined,
    address: practice.clinicAddress || undefined
  });

  await DoctorProfile.create({
    userId: user._id,
    professionalTitle: prof.professionalTitle || 'Dr.',
    specialization,
    qualifications: prof.qualifications || [],
    yearsOfExperience: prof.yearsOfExperience || 0,
    registrationNumber: prof.registrationNumber || undefined,
    registrationAuthority: prof.registrationAuthority || undefined,
    registrationState: prof.registrationState || undefined,
    bio: prof.bio || undefined,
    photoUrl: prof.photoUrl || undefined,
    clinic: {
      name: practice.clinicName || undefined,
      address: practice.clinicAddress || undefined,
      city: practice.city || undefined,
      phone: practice.clinicPhone || undefined
    },
    consultationFee: practice.consultationFee || 0,
    consultationTypes: practice.consultationTypes?.length ? practice.consultationTypes : ['in_person'],
    verificationStatus: 'pending'
  });

  await Availability.create({
    doctorId: user._id,
    workingDays: practice.workingDays || [],
    blockedDates: []
  });

  return { user, token: generateToken(String(user._id)), verificationStatus: 'pending' };
}

async function registerPatientAccount(validated: any) {
  const email = validated.email.toLowerCase();
  if (await User.findOne({ email })) {
    const error: any = new Error('email_taken');
    error.code = 409;
    throw error;
  }
  const user = await User.create({
    name: validated.name,
    email,
    password: validated.password,
    role: 'patient',
    phone: validated.phone || undefined
  });

  const p = validated.profile || {};
  if (p.dateOfBirth || p.sex || p.gender || p.city || p.bloodGroup || p.emergencyContact || p.allergies?.length) {
    await PatientProfile.create({
      userId: user._id,
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : undefined,
      sex: p.sex || undefined,
      gender: p.gender || undefined,
      city: p.city || undefined,
      bloodGroup: p.bloodGroup || undefined,
      allergies: p.allergies || undefined,
      emergencyContact: p.emergencyContact ? { ...p.emergencyContact } : undefined
    });
  }

  return { user, token: generateToken(String(user._id)) };
}

function handleAuthError(res: express.Response, err: any, fallback: string) {
  if (err?.code === 409) return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
  if (isZodError(err)) return zodErrorResponse(res, err);
  if (isDuplicateKeyError(err)) {
    return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
  }
  if (!isDbReady()) return res.status(503).json(dbUnavailable());
  console.error(fallback, err);
  res.status(500).json({ message: 'Something went wrong. Please try again in a moment.' });
}

router.post('/patient/register', async (req, res) => {
  try {
    const validated = patientRegisterSchema.parse(req.body);
    const { user, token } = await registerPatientAccount(validated);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err: any) {
    handleAuthError(res, err, 'patient register error:');
  }
});

router.post('/doctor/register', async (req, res) => {
  try {
    const validated = doctorRegisterSchema.parse(req.body);
    const { user, token, verificationStatus } = await registerDoctorAccount(validated);
    res.status(201).json({ token, user: publicUser(user), verificationStatus });
  } catch (err: any) {
    handleAuthError(res, err, 'doctor register error:');
  }
});

// Legacy combined register (kept for existing callers/tests) — bridges to the new flows
router.post('/register', async (req, res) => {
  const body = req.body || {};
  if (body.role === 'doctor') {
    const bridge = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
      confirmPassword: body.password,
      professional: {
        professionalTitle: 'Dr.',
        specialization: body.specialization || 'General Medicine',
        yearsOfExperience: 0
      },
      practice: {
        clinicName: body.hospital || undefined,
        clinicAddress: body.address || undefined,
        consultationTypes: ['in_person']
      }
    };
    try {
      const validated = doctorRegisterSchema.parse(bridge);
      const { user, token, verificationStatus } = await registerDoctorAccount(validated);
      return res.status(201).json({ token, user: publicUser(user), verificationStatus });
    } catch (err: any) {
      return handleAuthError(res, err, 'legacy doctor register error:');
    }
  }
  if (body.role === 'patient') {
    const bridge = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
      confirmPassword: body.password
    };
    try {
      const validated = patientRegisterSchema.parse(bridge);
      const { user, token } = await registerPatientAccount(validated);
      return res.status(201).json({ token, user: publicUser(user) });
    } catch (err: any) {
      return handleAuthError(res, err, 'legacy patient register error:');
    }
  }
  return res.status(400).json({ message: 'Please choose a valid account type.' });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'The email or password is incorrect.' });
    }
    const token = generateToken(String(user._id));
    res.json({ token, user: publicUser(user) });
  } catch (err: any) {
    if (isZodError(err)) return zodErrorResponse(res, err);
    if (!isDbReady()) return res.status(503).json(dbUnavailable());
    res.status(500).json({ message: 'Something went wrong while signing you in. Please try again.' });
  }
});

router.get('/me', auth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let profile: any = null;
    if (user.role === 'doctor') {
      const dp = await DoctorProfile.findOne({ userId: user._id }).lean();
      profile = dp
        ? {
            professionalTitle: dp.professionalTitle,
            specialization: dp.specialization,
            qualifications: dp.qualifications,
            yearsOfExperience: dp.yearsOfExperience,
            registrationNumber: dp.registrationNumber,
            registrationAuthority: dp.registrationAuthority,
            registrationState: dp.registrationState,
            bio: dp.bio,
            photoUrl: dp.photoUrl,
            clinic: dp.clinic,
            consultationFee: dp.consultationFee,
            consultationTypes: dp.consultationTypes,
            verificationStatus: dp.verificationStatus,
            hasVerificationDocs: dp.verificationDocs.length > 0
          }
        : null;
    } else {
      const pp = await PatientProfile.findOne({ userId: user._id }).lean();
      profile = pp
        ? {
            dateOfBirth: pp.dateOfBirth,
            sex: pp.sex,
            gender: pp.gender,
            city: pp.city,
            bloodGroup: pp.bloodGroup,
            allergies: pp.allergies,
            emergencyContact: pp.emergencyContact
          }
        : null;
    }
    res.json({ ...publicUser(user), profile });
  } catch (err: any) {
    if (!isDbReady()) return res.status(503).json(dbUnavailable());
    res.status(500).json({ message: 'Could not load your profile. Please try again.' });
  }
});

export default router;