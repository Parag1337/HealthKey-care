import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Check,
  Clock,
  IndianRupee,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Video,
  Building2
} from 'lucide-react';
import { doctorSearchAPI, appointmentsAPI, getErrorMessage } from '../../lib/api';
import { AppointmentType, DAY_LABELS, DayCode, DoctorCard as DoctorCardType, TimeSlot } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Field, Input, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [doctor, setDoctor] = useState<DoctorCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = useMemo(() => {
    const out: { date: Date; key: string }[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push({ date: d, key: dateKey(d) });
    }
    return out;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [type, setType] = useState<AppointmentType>('in_person');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const loadDoctor = useCallback(async () => {
    if (!id) return;
    try {
      const res = await doctorSearchAPI.getById(id);
      setDoctor(res.data);
    } catch {
      setError('Could not load this doctor.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDoctor();
  }, [loadDoctor]);

  const loadSlots = useCallback(
    async (date: string, t: AppointmentType) => {
      if (!id) return;
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const res = await doctorSearchAPI.getAvailability(id, date, t);
        setSlots(res.data.slots);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [id]
  );

  const pickDate = (key: string) => {
    setSelectedDate(key);
    loadSlots(key, type);
  };

  const pickType = (t: AppointmentType) => {
    setType(t);
    if (selectedDate) loadSlots(selectedDate, t);
  };

  const confirmBooking = async () => {
    if (!id || !selectedSlot || !doctor) return;
    setBooking(true);
    try {
      await appointmentsAPI.book({
        doctorId: id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        appointmentType: type,
        reason: reason || undefined,
        notes: notes || undefined
      });
      toast.success(`Appointment booked with ${doctor.name} on ${formatDate(selectedSlot.date)} at ${selectedSlot.startTime}`);
      setBookOpen(false);
      setSelectedSlot(null);
      loadSlots(selectedSlot.date, type);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Booking failed. Please try another slot.'));
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl border border-ink-200 bg-ink-100" />
        <div className="h-48 animate-pulse rounded-2xl border border-ink-200 bg-ink-100" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-500">{error || 'Doctor not found.'}</p>
        <Link to="/dashboard/doctors" className="mt-4 inline-block text-sm text-emerald-700">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard/doctors" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" /> Find a doctor
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-ink-800">
                  {doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}
                  {doctor.name}
                </h1>
                {doctor.verificationStatus === 'verified' && (
                  <Badge variant="success">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-ink-500">{doctor.specialization || 'General Practitioner'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                {doctor.yearsOfExperience ? (
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> {doctor.yearsOfExperience} years experience
                  </span>
                ) : null}
                {doctor.consultationFee ? (
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" /> {doctor.consultationFee} per visit
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[doctor.clinic?.name, doctor.clinic?.city].filter(Boolean).join(', ') || 'Location on request'}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {doctor.qualifications?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Qualifications</p>
              <p className="mt-1 text-sm text-ink-600">{doctor.qualifications.join(', ')}</p>
            </div>
          ) : null}
          {doctor.registrationNumber ? (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-400">
              <span>
                Reg. No: {doctor.registrationNumber}
                {doctor.registrationState ? ` (${doctor.registrationState})` : ''}
              </span>
            </div>
          ) : null}
          {doctor.bio ? <p className="text-sm text-ink-500">{doctor.bio}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Book an appointment</CardTitle>
            <CardDescription>Choose a day and time below. Slots refresh based on availability.</CardDescription>
          </div>
          {doctor.consultationTypes?.length ? (
            <div className="flex gap-2">
              {(['in_person', 'online'] as AppointmentType[]).map((t) =>
                doctor.consultationTypes!.includes(t) ? (
                  <button
                    key={t}
                    onClick={() => pickType(t)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                      type === t
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-ink-200 text-ink-500 hover:text-ink-700'
                    )}
                  >
                    {t === 'online' ? <Video className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                    {t === 'in_person' ? 'In-person' : 'Online'}
                  </button>
                ) : null
              )}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {days.map((d) => {
              const isSel = d.key === selectedDate;
              return (
                <button
                  key={d.key}
                  onClick={() => pickDate(d.key)}
                  className={cn(
                    'flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 transition',
                    isSel
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
                  )}
                >
                  <span className="text-[10px] uppercase">{DAY_LABELS[d.date.getDay() === 0 ? 'SUN' : (['MON','TUE','WED','THU','FRI','SAT'][d.date.getDay() - 1] as DayCode)]}</span>
                  <span className="text-sm font-semibold text-ink-700">{d.date.getDate()}</span>
                </button>
              );
            })}
          </div>

          {!selectedDate ? (
            <p className="py-6 text-center text-sm text-ink-400">
              <CalendarDays className="mx-auto mb-2 h-6 w-6" />
              Select a day to see available slots.
            </p>
          ) : slotsLoading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-ink-100" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">
              No {type === 'online' ? 'online' : 'in-person'} slots available on this day.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((s) => {
                const isSel = selectedSlot?.startTime === s.startTime;
                return (
                  <button
                    key={s.startTime}
                    onClick={() => setSelectedSlot(s)}
                    className={cn(
                      'flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm font-medium transition',
                      isSel
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {s.startTime}
                  </button>
                );
              })}
            </div>
          )}

          {selectedSlot && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-800">
                    {formatDate(selectedSlot.date)} · {selectedSlot.startTime}–{selectedSlot.endTime}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-ink-500">
                    {type === 'in_person' ? 'In-person consultation' : 'Online video consultation'}
                    {doctor.consultationFee ? ` · ₹${doctor.consultationFee}` : ''}
                  </p>
                </div>
                <Button onClick={() => setBookOpen(true)}>
                  <Check className="h-4 w-4" /> Book this slot
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        title="Confirm appointment"
        description={`${doctor.name} · ${selectedSlot ? `${formatDate(selectedSlot.date)} at ${selectedSlot.startTime}` : ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setBookOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBooking} loading={booking}>
              Confirm booking
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Reason for visit">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Follow-up for chest pain" />
          </Field>
          <Field label="Notes (optional)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the doctor should know" />
          </Field>
          {doctor.consultationFee ? (
            <p className="text-xs text-ink-400">A consultation fee of ₹{doctor.consultationFee} applies at the clinic / on payment link.</p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}