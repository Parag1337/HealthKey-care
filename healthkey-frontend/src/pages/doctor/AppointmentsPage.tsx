import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Check, UserX, X } from 'lucide-react';
import { appointmentsAPI, getErrorMessage } from '../../lib/api';
import { Appointment, APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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

export function DoctorAppointmentsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const setStatus = async (a: Appointment, status: 'completed' | 'no_show' | 'cancelled') => {
    setBusyId(a._id);
    try {
      await appointmentsAPI.setStatus(a._id, { status });
      toast.success(`Marked ${APPOINTMENT_STATUS_LABELS[status].toLowerCase()}.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the appointment.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="mt-1 text-sm text-ink-500">Your consultation schedule.</p>
        </div>
        <div className="flex rounded-lg border border-ink-200 bg-white p-1">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition',
                tab === t ? 'bg-ink-800 text-white' : 'text-ink-500 hover:text-ink-800'
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
          <CalendarClock className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 text-sm text-ink-500">No {tab} appointments.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <Card key={a._id}>
              <CardHeader>
                <div>
                  <CardTitle>{a.patient?.name || 'Patient'}</CardTitle>
                  <CardDescription>
                    {formatDate(a.date)} at {a.startTime}–{a.endTime} · {APPOINTMENT_TYPE_LABELS[a.appointmentType]}
                    {a.reason ? ` · Reason: ${a.reason}` : ''}
                    {a.notes ? ` · ${a.notes}` : ''}
                  </CardDescription>
                </div>
                <Badge variant={slotStatusColor(a.status)}>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
              </CardHeader>
              {(a.status === 'confirmed' || a.status === 'rescheduled') && (
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => setStatus(a, 'completed')} loading={busyId === a._id}>
                    <Check className="h-3.5 w-3.5" /> Mark completed
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setStatus(a, 'no_show')}>
                    <UserX className="h-3.5 w-3.5" /> No show
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setStatus(a, 'cancelled')}>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}