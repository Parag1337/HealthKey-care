import { useCallback, useEffect, useState } from 'react';
import { Link2, User } from 'lucide-react';
import { accessAPI, getErrorMessage } from '../../lib/api';
import { AccessRequest, PERMISSION_LABELS, PERMISSION_KEYS } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { AccessStatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime, countdownLabel } from '../../lib/format';
import { Link } from 'react-router-dom';

function RequestCard({ request, onDecided }: { request: AccessRequest; onDecided: () => void }) {
  const [busy, setBusy] = useState<'approve' | 'deny' | null>(null);
  const { success, error: toastError } = useToast();

  const act = async (kind: 'approve' | 'deny') => {
    setBusy(kind);
    try {
      if (kind === 'approve') await accessAPI.approve(request._id);
      else await accessAPI.deny(request._id);
      success(kind === 'approve' ? 'Access approved. You can now view this patient within the consent scope.' : 'Request denied.');
      onDecided();
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const granted = PERMISSION_KEYS.filter((k) => request.permissions[k]);
  const isPending = request.status === 'pending';

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-800">{request.patient?.name || 'Patient'}</p>
              <p className="text-xs text-ink-500">
                Requested {formatDateTime(request.requestedAt)} · {request.requestedHours}{' '}
                {request.requestedHours === 1 ? 'hour' : 'hours'}
              </p>
            </div>
          </div>
          <AccessStatusBadge status={request.status} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Requested access</p>
          <div className="space-y-1">
            {granted.map((k) => (
              <p key={k} className="text-sm text-ink-600">
                <span className="mr-1.5 text-emerald-600">✓</span>
                {PERMISSION_LABELS[k]}
              </p>
            ))}
          </div>
        </div>

        <p className="text-xs text-ink-500">Duration: {request.requestedHours} {request.requestedHours === 1 ? 'hour' : 'hours'}</p>

        {isPending && (
          <div className="flex gap-2 border-t border-ink-200 pt-3">
            <Button size="sm" variant="outline" onClick={() => act('deny')} loading={busy === 'deny'} disabled={busy !== null}>
              Deny
            </Button>
            <Button size="sm" onClick={() => act('approve')} loading={busy === 'approve'} disabled={busy !== null}>
              Approve
            </Button>
          </div>
        )}

        {request.status === 'approved' && request.expiresAt && (
          <p className="text-xs text-emerald-700">
            ● Active — expires {formatDateTime(request.expiresAt)} ({countdownLabel(request.expiresAt)} left)
          </p>
        )}

        {request.status === 'approved' && (
          <div className="border-t border-ink-200 pt-3">
            <Link to={`/doctor/patients/${request.patientId}`}>
              <Button size="sm" variant="outline">
                View Patient Records
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const DoctorRequestsPage = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await accessAPI.getDoctorRequests();
      setRequests(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SkeletonList rows={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Access Requests</h1>
        <p className="page-subtitle">Patients who scanned your QR code and asked for consent.</p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-8 w-8" />}
          title="No access requests yet"
          description="Show your HealthKey QR code to patients so they can securely request access to their records with you."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r._id} request={r} onDecided={load} />
          ))}
        </div>
      )}
    </div>
  );
};