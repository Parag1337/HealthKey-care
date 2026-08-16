import express from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Availability from '../models/Availability.js';
import Appointment, { AppointmentStatus } from '../models/Appointment.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { recordAudit, auditActor } from '../services/auditService.js';
import { isDuplicateKeyError, isZodError, zodErrorResponse } from '../utils/apiErrors.js';
import { dateKey, generateDaySlots, slotKey } from '../services/slots.js';

const router = express.Router();

const createSchema = z.object({
  doctorId: z.string().length(24, 'Invalid doctor.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a valid time.'),
  appointmentType: z.enum(['in_person', 'online']),
  reason: z.string().max(160).optional().or(z.literal('')),
  notes: z.string().max(600).optional().or(z.literal(''))
});

function serializeAppointment(a: any) {
  const plain = a.toObject ? a.toObject() : { ...a };
  if (plain.doctorId && typeof plain.doctorId === 'object') {
    plain.doctor = plain.doctorId;
    plain.doctorId = String(plain.doctorId._id);
  }
  if (plain.patientId && typeof plain.patientId === 'object') {
    plain.patient = plain.patientId;
    plain.patientId = String(plain.patientId._id);
  }
  return plain;
}

async function loadAvailabilityOrFail(doctorId: string) {
  const availability = await Availability.findOne({ doctorId }).lean();
  if (!availability || !availability.workingDays?.length) {
    const error: any = new Error('This doctor has not set their availability yet.');
    error.status = 400;
    throw error;
  }
  return availability;
}

async function assertSlotFree(doctorId: string, date: string, startTime: string, excludeKey?: string) {
  const target = slotKey(doctorId, date, startTime);
  const existing = await Appointment.findOne({ slotKey: target, status: { $in: ['pending', 'confirmed', 'rescheduled'] } });
  if (existing && existing.slotKey !== excludeKey) {
    const error: any = new Error('That time was just booked by another patient. Please choose another slot.');
    error.status = 409;
    throw error;
  }
}

async function computeSlot(availability: any, date: string, startTime: string, type: 'in_person' | 'online') {
  const [y, m, d] = date.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const slots = generateDaySlots(availability, target, type);
  const match = slots.find((s) => s.startTime === startTime && s.date === date);
  if (!match) {
    const error: any = new Error('That slot is not available. Please choose another time.');
    error.status = 400;
    throw error;
  }
  return match;
}

// Patient books an appointment (slot claim is concurrency-safe via unique slotKey)
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can book appointments.' });
    }
    const validated = createSchema.parse(req.body);
    const doctor = await User.findById(validated.doctorId).select('role name').lean();
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    const profile = await DoctorProfile.findOne({ userId: doctor._id }).lean();
    if (!profile) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    const availability = await loadAvailabilityOrFail(String(doctor._id));
    const slot = await computeSlot(availability, validated.date, validated.startTime, validated.appointmentType);

    const appointment = await Appointment.create({
      patientId: req.user!._id,
      doctorId: doctor._id,
      appointmentType: validated.appointmentType,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotKey: slotKey(String(doctor._id), slot.date, slot.startTime),
      status: 'confirmed',
      reason: validated.reason || undefined,
      notes: validated.notes || undefined
    });

    recordAudit({
      patientId: String(req.user!._id),
      doctorId: String(doctor._id),
      ...auditActor(req.user!),
      action: 'appointment_booked',
      details: { doctorId: String(doctor._id), date: slot.date, startTime: slot.startTime, appointmentId: String(appointment._id) }
    }).catch(() => {});

    const populated = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name specialization hospital')
      .populate('patientId', 'name email');
    res.status(201).json(serializeAppointment(populated));
  } catch (err: any) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ message: 'That time was just booked by another patient. Please choose another slot.' });
    }
    if (isZodError(err)) return zodErrorResponse(res, err);
    if (err?.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Could not book the appointment. Please try again.' });
  }
});

router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const query: any = req.user!.role === 'patient' ? { patientId: req.user!._id } : { doctorId: req.user!._id };
    const status = String(req.query.status || '');
    if (status) query.status = status;
    const date = String(req.query.date || '');
    if (date) query.date = date;
    const scope = String(req.query.scope || '');
    if (scope === 'upcoming') {
      query.status = { $in: ['pending', 'confirmed', 'rescheduled'] };
      query.date = { $gte: dateKey(new Date()) };
    } else if (scope === 'past') {
      query.status = { $in: ['completed', 'cancelled', 'no_show', 'rescheduled'] };
      query.date = { $lte: dateKey(new Date()) };
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, startTime: 1 })
      .populate('doctorId', 'name specialization hospital')
      .populate('patientId', 'name email')
      .limit(100);
    res.json(appointments.map(serializeAppointment));
  } catch {
    res.status(500).json({ message: 'Could not load appointments.' });
  }
});

const cancelSchema = z.object({
  reason: z.string().max(300).optional().or(z.literal(''))
});

router.patch('/:id/cancel', auth, async (req: AuthRequest, res) => {
  try {
    const { reason } = cancelSchema.parse(req.body || {});
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    if (String(appointment.patientId) !== String(req.user!._id) && String(appointment.doctorId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'You can only cancel your own appointments.' });
    }
    if (!['pending', 'confirmed', 'rescheduled'].includes(appointment.status)) {
      return res.status(409).json({ message: 'This appointment can no longer be cancelled.' });
    }
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason || undefined;
    await appointment.save();

    recordAudit({
      patientId: String(appointment.patientId),
      doctorId: String(appointment.doctorId),
      ...auditActor(req.user!),
      action: 'appointment_cancelled',
      details: { appointmentId: String(appointment._id), date: appointment.date, startTime: appointment.startTime }
    }).catch(() => {});

    res.json(serializeAppointment(appointment));
  } catch (err: any) {
    if (isZodError(err)) return zodErrorResponse(res, err);
    res.status(500).json({ message: 'Could not cancel the appointment.' });
  }
});

const statusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'no_show', 'cancelled']),
  reason: z.string().max(300).optional().or(z.literal(''))
});

router.patch('/:id/status', auth, async (req: AuthRequest, res) => {
  try {
    const { status, reason } = statusSchema.parse(req.body || {});
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    if (String(appointment.doctorId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'Only the doctor can change appointment status.' });
    }
    if (appointment.status === 'cancelled') {
      return res.status(409).json({ message: 'This appointment is already cancelled.' });
    }
    appointment.status = status as AppointmentStatus;
    if (status === 'cancelled') {
      appointment.cancelledAt = new Date();
      appointment.cancellationReason = reason || undefined;
    }
    await appointment.save();
    res.json(serializeAppointment(appointment));
  } catch (err: any) {
    if (isZodError(err)) return zodErrorResponse(res, err);
    res.status(500).json({ message: 'Could not update the appointment.' });
  }
});

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  appointmentType: z.enum(['in_person', 'online']).optional()
});

router.patch('/:id/reschedule', auth, async (req: AuthRequest, res) => {
  try {
    const parsed = rescheduleSchema.parse(req.body || {});
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    if (String(appointment.patientId) !== String(req.user!._id) && String(appointment.doctorId) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'You can only reschedule your own appointments.' });
    }
    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      return res.status(409).json({ message: 'This appointment can no longer be rescheduled.' });
    }
    await assertSlotFree(String(appointment.doctorId), parsed.date, parsed.startTime, appointment.slotKey);

    const availability = await Availability.findOne({ doctorId: appointment.doctorId }).lean();
    const profile = await DoctorProfile.findOne({ userId: appointment.doctorId }).lean();
    if (!availability || !profile) {
      return res.status(400).json({ message: 'This doctor has not set their availability yet.' });
    }
    const type = parsed.appointmentType || appointment.appointmentType;
    const slot = await computeSlot(availability, parsed.date, parsed.startTime, type);

    appointment.previousSlotKey = appointment.slotKey;
    appointment.date = slot.date;
    appointment.startTime = slot.startTime;
    appointment.endTime = slot.endTime;
    appointment.appointmentType = type;
    appointment.slotKey = slotKey(String(appointment.doctorId), slot.date, slot.startTime);
    appointment.status = 'rescheduled';
    await appointment.save();

    recordAudit({
      patientId: String(appointment.patientId),
      doctorId: String(appointment.doctorId),
      ...auditActor(req.user!),
      action: 'appointment_rescheduled',
      details: { appointmentId: String(appointment._id), from: appointment.previousSlotKey, to: appointment.slotKey }
    }).catch(() => {});

    const populated = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name specialization hospital')
      .populate('patientId', 'name email');
    res.json(serializeAppointment(populated));
  } catch (err: any) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ message: 'That time was just booked by another patient. Please choose another slot.' });
    }
    if (isZodError(err)) return zodErrorResponse(res, err);
    if (err?.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Could not reschedule the appointment.' });
  }
});

export default router;