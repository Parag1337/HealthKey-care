import express from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Availability from '../models/Availability.js';
import Appointment from '../models/Appointment.js';
import { isZodError, zodErrorResponse } from '../utils/apiErrors.js';
import {
  addDays,
  dateKey,
  generateSlotsFromDb,
  slotKey,
  toWeekDay
} from '../services/slots.js';

const router = express.Router();

const searchSchema = z.object({
  q: z.string().max(80).optional(),
  specialty: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  type: z.enum(['in_person', 'online']).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  minYears: z.coerce.number().min(0).max(60).optional(),
  verifiedOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(30).default(30)
});

async function doctorView(user: any, profile: any, withSlots = false) {
  const base = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    specialization: profile.specialization,
    professionalTitle: profile.professionalTitle,
    qualifications: profile.qualifications,
    yearsOfExperience: profile.yearsOfExperience,
    registrationNumber: profile.registrationNumber,
    registrationState: profile.registrationState,
    bio: profile.bio,
    photoUrl: profile.photoUrl,
    clinic: profile.clinic,
    consultationFee: profile.consultationFee,
    consultationTypes: profile.consultationTypes,
    verificationStatus: profile.verificationStatus
  };
  if (!withSlots) return base;

  const availability = await Availability.findOne({ doctorId: user._id }).lean();
  if (!availability) return { ...base, nextAvailable: null };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const types: ('in_person' | 'online')[] = (profile.consultationTypes || ['in_person']) as ('in_person' | 'online')[];
  const booked = new Set(
    (await Appointment.find({
      doctorId: user._id,
      status: { $in: ['pending', 'confirmed', 'rescheduled'] },
      date: { $gte: dateKey(today) }
    })
      .select('date startTime')
      .lean()).map((a: any) => slotKey(String(user._id), a.date, a.startTime))
  );

  // First available slot within the next 14 days
  for (const type of types) {
    const slots = await generateSlotsFromDb(availability, today, 14, String(user._id), type, booked);
    if (slots.length > 0) {
      return { ...base, nextAvailable: slots[0] };
    }
  }
  return { ...base, nextAvailable: null };
}

router.get('/', async (req, res) => {
  try {
    const parsed = searchSchema.parse(req.query);
    const query: any = {};
    if (parsed.q) {
      const rx = new RegExp(parsed.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchedUsers = await User.find({
        role: 'doctor',
        $or: [{ name: rx }, { specialization: rx }, { hospital: rx }]
      }).select('_id');
      const userIds = matchedUsers.map((u: any) => u._id);
      query.$or = [
        { specialization: rx },
        { 'clinic.name': rx },
        { 'clinic.city': rx },
        { userId: { $in: userIds } }
      ];
    }
    if (parsed.specialty) query.specialization = new RegExp(parsed.specialty, 'i');
    if (parsed.city) query['clinic.city'] = new RegExp(parsed.city, 'i');
    if (parsed.type) query.consultationTypes = parsed.type;
    if (parsed.maxFee !== undefined) query.consultationFee = { $lte: parsed.maxFee };
    if (parsed.minYears !== undefined) query.yearsOfExperience = { $gte: parsed.minYears };
    if (parsed.verifiedOnly) query.verificationStatus = 'verified';

    const profiles = await DoctorProfile.find(query).limit(parsed.limit).lean();
    const userIds = profiles.map((p: any) => p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = new Map(users.map((u: any) => [String(u._id), u]));

    const results = [];
    for (const profile of profiles) {
      const user = userMap.get(String(profile.userId));
      if (!user) continue;
      results.push(await doctorView(user, profile, true));
    }
    res.json(results);
  } catch (err: any) {
    if (isZodError(err)) return zodErrorResponse(res, err);
    res.status(500).json({ message: 'Could not load doctors. Please try again.' });
  }
});

router.get('/specialties', async (_req, res) => {
  try {
    const list = await DoctorProfile.distinct('specialization').lean();
    res.json(list.filter(Boolean).sort());
  } catch {
    res.status(500).json({ message: 'Could not load specialities.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email role').lean();
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    const profile = await DoctorProfile.findOne({ userId: user._id }).lean();
    if (!profile) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    res.json(await doctorView(user, profile, true));
  } catch {
    res.status(500).json({ message: 'Could not load this doctor. Please try again.' });
  }
});

router.get('/:id/availability', async (req, res) => {
  try {
    const schema = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      type: z.enum(['in_person', 'online']).optional()
    });
    const parsed = schema.parse({
      date: String(req.query.date || ''),
      type: String(req.query.type || 'in_person') === 'online' ? 'online' : 'in_person'
    });
    const { date } = parsed;
    const type: 'in_person' | 'online' = parsed.type === 'online' ? 'online' : 'in_person';
    if (date < dateKey(new Date())) {
      return res.json({ date, slots: [] });
    }
    if (date > dateKey(addDays(new Date(), 60))) {
      return res.status(400).json({ message: 'Availability is only shown for the next 60 days.' });
    }

    const doctor = await User.findById(req.params.id).select('role').lean();
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    const availability = await Availability.findOne({ doctorId: req.params.id }).lean();
    if (!availability) return res.json({ date, slots: [] });

    const booked = new Set(
      (await Appointment.find({
        doctorId: req.params.id,
        status: { $in: ['pending', 'confirmed', 'rescheduled'] },
        date
      })
        .select('startTime')
        .lean()).map((a: any) => slotKey(req.params.id, date, a.startTime))
    );

    const [y, m, d] = date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const slots = await generateSlotsFromDb(availability, target, 1, req.params.id, type, booked);
    res.json({ date, weekday: toWeekDay(target), slots });
  } catch (err: any) {
    if (isZodError(err)) return zodErrorResponse(res, err);
    res.status(500).json({ message: 'Could not load availability. Please try again.' });
  }
});

export default router;