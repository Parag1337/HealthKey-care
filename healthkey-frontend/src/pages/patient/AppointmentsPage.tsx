import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, RefreshCcw } from 'lucide-react';
import { appointmentsAPI, doctorSearchAPI, getErrorMessage } from '../../lib/api';
import { Appointment, APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS, AppointmentType, TimeSlot } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Field, Select } from '../../components/ui/Field';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

function slotStatusColor(status: Appointment['status']): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'confirmed':
    case 'rescheduled':
      return 'success';
    case 'completed':
      return 'info';
    case 'cancelled':
    case 'no_show':
      return 'danger';
    default:
      return 'warning';
  }
}

export function PatientAppointmentsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const [reschedTarget, setReschedTarget] = useState<Appointment | null>(null);
  const [reschedSlots, setReschedSlots] = useState<TimeSlot[]>([]);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedType, setReschedType] = useState<AppointmentType>('in_person');
  const [reschedSlot, setReschedSlot] = useState<TimeSlot | null>(null);
  const [slotsBusy, setSlotsBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  const dates = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, label: formatDate(d, { day: 'numeric', month: 'short' }) });
    }
    return out;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.list({ scope: tab });
      setAppointments(res.data);
    } catch {
      toast.error('Could not load appointments.');
    } finally {
      setLoading(false);
    }
  }, [tab, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openReschedule = (a: Appointment) => {
    setReschedTarget(a);
    setReschedDate(a.date);
    setReschedType(a.appointmentType);
    setReschedSlot(null);
    setReschedSlots([]);
    loadReschedSlots(a.doctorId, a.date, a.appointmentType);
  };

  const loadReschedSlots = async (doctorId: string, date: string, t: AppointmentType) => {
    setSlotsBusy(true);
    try {
      const res = await doctorSearchAPI.getAvailability(doctorId, date, t);
      setReschedSlots(res.data.slots);
    } catch {
      setReschedSlots([]);
    } finally {
      setSlotsBusy(false);
    }
  };

  const onReschedDate = (key: string) => {
    setReschedDate(key);
    setReschedSlot(null);
    if (reschedTarget) loadReschedSlots(reschedTarget.doctorId, key, reschedType);
  };

  const onReschedType = (t: AppointmentType) => {
    setReschedType(t);
    setReschedSlot(null);
    if (reschedTarget) loadReschedSlots(reschedTarget.doctorId, reschedDate, t);
  };

  const confirmReschedule = async () => {
    if (!reschedTarget || !reschedSlot) return;
    setBusy(true);
    try {
      await appointmentsAPI.reschedule(reschedTarget._id, {
        date: reschedSlot.date,
        startTime: reschedSlot.startTime,
        appointmentType: reschedType
      });
      toast.success('Appointment rescheduled.');
      setReschedTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reschedule.'));
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      await appointmentsAPI.cancel(cancelTarget._id, undefined);
      toast.success('Appointment cancelled.');
      setCancelTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="mt-1 text-sm text-ink-400">Manage your consultations.</p>
        </div>
        <div className="flex rounded-lg border border-ink-200 bg-white p-1">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition',
                tab === t ? 'bg-ink-800 text-white' : 'text-ink-500 hover:text-ink-700'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-ink-200 bg-ink-100" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="py-14 text-center">
          <CalendarClock className="mx-auto h-10 w-10 text-ink-200" />
          <p className="mt-3 text-sm text-ink-500">No {tab} appointments.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <Card key={a._id}>
              <CardHeader>
                <div>
                  <CardTitle>
                    {a.doctor?.name || 'Doctor'}
                    {a.doctor?.specialization ? (
                      <span className="ml-2 font-normal text-ink-400">· {a.doctor.specialization}</span>
                    ) : null}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(a.date)} at {a.startTime}–{a.endTime} · {APPOINTMENT_TYPE_LABELS[a.appointmentType]}
                  </CardDescription>
                </div>
                <Badge variant={slotStatusColor(a.status)}>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                {a.reason ? <p className="flex-1 text-sm text-ink-500">Reason: {a.reason}</p> : <span className="flex-1" />}
                {['confirmed', 'rescheduled'].includes(a.status) && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openReschedule(a)}>
                      <RefreshCcw className="h-3.5 w-3.5" /> Reschedule
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setCancelTarget(a)}>
                      Cancel
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel appointment"
        message={`Cancel your appointment with ${cancelTarget?.doctor?.name || 'the doctor'} on ${cancelTarget ? formatDate(cancelTarget.date) : ''}?`}
        confirmLabel={busy ? 'Cancelling…' : 'Cancel appointment'}
        danger
      />

      <Modal
        open={!!reschedTarget}
        onClose={() => setReschedTarget(null)}
        title="Reschedule appointment"
        description={`Pick a new time with ${reschedTarget?.doctor?.name || 'the doctor'}.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setReschedTarget(null)}>
              Close
            </Button>
            <Button onClick={confirmReschedule} loading={busy} disabled={!reschedSlot}>
              <Check className="h-4 w-4" /> Confirm new time
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Field label="Day" className="flex-1">
              <Select
                value={reschedDate}
                onChange={(e) => onReschedDate(e.target.value)}
              >
                {dates.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type" className="flex-1">
              <Select
                value={reschedType}
                onChange={(e) => onReschedType(e.target.value as AppointmentType)}
              >
                <option value="in_person">In-person</option>
                <option value="online">Online</option>
              </Select>
            </Field>
          </div>
          {slotsBusy ? (
            <p className="py-4 text-center text-sm text-ink-400">Loading slots…</p>
          ) : reschedSlots.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-400">No slots available for this day.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {reschedSlots.map((s) => (
                <button
                  key={s.startTime}
                  onClick={() => setReschedSlot(s)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-sm font-medium transition',
                    reschedSlot?.startTime === s.startTime
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                  )}
                >
                  {s.startTime}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}