import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { accessAPI, getErrorMessage } from '../../lib/api';
import { AccessRequest, PERMISSION_LABELS, PERMISSION_KEYS } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { formatDateTime, countdownLabel } from '../../lib/format';

export const DoctorPatientsPage = () => {
  const [active, setActive] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await accessAPI.getActive();
      setActive(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SkeletonList rows={3} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Patients</h1>
        <p className="page-subtitle">Patients who currently share their health information with you.</p>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No connected patients"
          description="Once a patient approves your access request, they will appear here and you can view only what they consented to share."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {active.map((a) => (
            <Card key={a._id}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-ink-800">{a.patient?.name || 'Patient'}</p>
                    <p className="text-xs text-ink-500">{a.patient?.email || ''}</p>
                  </div>
                  <Badge variant="success">● ACTIVE</Badge>
                </div>
                <div className="space-y-1">
                  {PERMISSION_KEYS.filter((k) => a.permissions[k]).map((k) => (
                    <p key={k} className="text-sm text-ink-600">
                      <span className="mr-1.5 text-emerald-600">✓</span>
                      {PERMISSION_LABELS[k]}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-ink-500">
                  Requested {formatDateTime(a.requestedAt)} · Expires {a.expiresAt ? formatDateTime(a.expiresAt) : '—'} (
                  {a.expiresAt ? countdownLabel(a.expiresAt) : '—'} left)
                </p>
                <Link to={`/doctor/patients/${a.patientId}`} className="inline-block">
                  <Button size="sm">View Patient Records</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};