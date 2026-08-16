import { useCallback, useEffect, useState } from 'react';
import { FileClock, FileText, Lock, ShieldCheck, ScrollText } from 'lucide-react';
import { auditAPI, getErrorMessage } from '../../lib/api';
import { AuditEvent } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { formatDateTime } from '../../lib/format';

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  document_uploaded: { label: 'Document uploaded', icon: <FileText className="h-4 w-4" />, variant: 'info' },
  document_viewed: { label: 'Document viewed', icon: <FileText className="h-4 w-4" />, variant: 'warning' },
  access_requested: { label: 'Access requested', icon: <Lock className="h-4 w-4" />, variant: 'warning' },
  access_approved: { label: 'Access approved', icon: <ShieldCheck className="h-4 w-4" />, variant: 'success' },
  access_denied: { label: 'Access denied', icon: <Lock className="h-4 w-4" />, variant: 'danger' },
  access_revoked: { label: 'Access revoked', icon: <ShieldCheck className="h-4 w-4" />, variant: 'danger' },
  prescription_created: { label: 'Prescription recorded', icon: <ScrollText className="h-4 w-4" />, variant: 'info' }
};

const variantClass = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-ink-100 text-ink-500'
};

export const PatientAuditPage = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditAPI.getMyAudit();
      setEvents(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Security & Access History</h1>
        <p className="page-subtitle">
          A transparent, tamper-resistant record of every access to your healthcare information.
        </p>
      </div>

      {loading && <SkeletonList rows={5} />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && events.length === 0 && (
        <EmptyState
          icon={<FileClock className="h-8 w-8" />}
          title="No events yet"
          description="Every security-relevant action — uploads, views, requests, approvals — will be recorded here."
        />
      )}

      {!loading && !error && events.length > 0 && (
        <Card>
          <CardContent>
            <ol className="relative space-y-0">
              {events.map((e, i) => {
                const meta = ACTION_META[e.action] || {
                  label: e.action.replace(/_/g, ' '),
                  icon: <ShieldCheck className="h-4 w-4" />,
                  variant: 'neutral' as const
                };
                return (
                  <li key={e._id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < events.length - 1 && (
                      <span aria-hidden className="absolute left-[15px] top-8 bottom-0 w-px bg-ink-200" />
                    )}
                    <span
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        variantClass[meta.variant]
                      }`}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-ink-800">{meta.label}</p>
                        <span className="text-xs text-ink-400">{formatDateTime(e.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-400">
                        {e.details?.title ? `${e.details.title} — ` : ''}
                        {e.actorName} ({e.actorRole === 'doctor' ? 'Doctor' : 'You'})
                      </p>
                      {e.details?.txId && (
                        <Badge variant="neutral" className="mt-1.5 font-mono">
                          audit: {String(e.details.txId).slice(0, 12)}…
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};