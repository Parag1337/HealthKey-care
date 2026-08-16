import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accessAPI, getErrorMessage } from '../../lib/api';
import { AccessRequest, PERMISSION_LABELS, PERMISSION_KEYS } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { AccessStatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime, countdownLabel } from '../../lib/format';

function PermissionList({ request }: { request: AccessRequest }) {
  const granted = PERMISSION_KEYS.filter((k) => request.permissions[k]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {granted.map((k) => (
        <Badge key={k} variant="success" className="font-normal">
          ✓ {PERMISSION_LABELS[k]}
        </Badge>
      ))}
      {granted.length === 0 && <span className="text-xs text-ink-300">None</span>}
    </div>
  );
}

export const PatientAccessControlPage = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState<AccessRequest | null>(null);
  const [cancelling, setCancelling] = useState<AccessRequest | null>(null);
  const { success, error: toastError } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await accessAPI.getMyRequests();
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

  const active = requests.filter((r) => r.status === 'approved');
  const pending = requests.filter((r) => r.status === 'pending');
  const history = requests.filter((r) => !['approved', 'pending'].includes(r.status));

  const handleRevoke = async () => {
    if (!revoking) return;
    try {
      await accessAPI.revoke(revoking._id);
      success('Access revoked. The doctor can no longer see your information.');
      load();
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const handleCancel = async () => {
    if (!cancelling) return;
    try {
      await accessAPI.cancel(cancelling._id);
      success('Pending request cancelled.');
      load();
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  if (loading) return <SkeletonList rows={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Access Control</h1>
          <p className="page-subtitle">You decide which doctors can see your information, and for how long.</p>
        </div>
        <Link to="/dashboard/connect">
          <Button variant="outline">
            <QrCode className="h-4 w-4" /> Connect to Doctor
          </Button>
        </Link>
      </div>

      {requests.length === 0 && (
        <EmptyState
          icon={<ShieldCheck className="h-8 w-8" />}
          title="No access requests yet"
          description="Scan a doctor's HealthKey QR code to request secure access. You control permissions and duration."
          actionLabel="Connect to a doctor"
          onAction={() => (window.location.href = '/dashboard/connect')}
        />
      )}

      {active.length > 0 && (
        <section aria-label="Active access" className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Active Access</h2>
          {active.map((r) => (
            <Card key={r._id}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-ink-800">{r.doctor?.name}</p>
                    <AccessStatusBadge status="approved" />
                  </div>
                  <div className="text-xs text-ink-400">
                    {r.doctor?.specialization && <span>{r.doctor.specialization} · </span>}
                    <span>Expires {r.expiresAt ? formatDateTime(r.expiresAt) : '—'}</span>
                    {r.expiresAt && (
                      <span className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 font-medium text-ink-600">
                        {countdownLabel(r.expiresAt)} left
                      </span>
                    )}
                  </div>
                  <PermissionList request={r} />
                </div>
                <Button variant="danger" size="sm" onClick={() => setRevoking(r)}>
                  Revoke Access
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {pending.length > 0 && (
        <section aria-label="Pending requests" className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Pending Requests</h2>
          {pending.map((r) => (
            <Card key={r._id}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-ink-800">{r.doctor?.name}</p>
                    <AccessStatusBadge status="pending" />
                  </div>
                  <p className="text-xs text-ink-400">
                    Requested {formatDateTime(r.requestedAt)} · {r.requestedHours}{' '}
                    {r.requestedHours === 1 ? 'hour' : 'hours'} duration
                  </p>
                  <PermissionList request={r} />
                </div>
                <Button variant="outline" size="sm" onClick={() => setCancelling(r)}>
                  Cancel Request
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {history.length > 0 && (
        <section aria-label="Access history" className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">History</h2>
          <Card>
            <CardContent>
              <ul className="divide-y divide-ink-200">
                {history.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="text-sm text-ink-700">{r.doctor?.name || 'Doctor'}</p>
                      <p className="text-xs text-ink-400">
                        {formatDateTime(r.decidedAt || r.createdAt)} · {r.requestedHours}{' '}
                        {r.requestedHours === 1 ? 'hour' : 'hours'}
                      </p>
                    </div>
                    <AccessStatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={handleRevoke}
        title="Revoke access?"
        message={`${revoking?.doctor?.name || 'This doctor'} will immediately lose access to your records, prescriptions and vitals. Access can be requested again later.`}
        confirmLabel="Revoke Access"
        danger
      />
      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={handleCancel}
        title="Cancel request?"
        message="Your pending access request will be cancelled. The doctor will not be able to approve it."
        confirmLabel="Cancel Request"
      />
    </div>
  );
};