import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { auditAPI, getErrorMessage } from '../../lib/api';
import { AuditEvent } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { formatDateTime } from '../../lib/format';

export const DoctorAuditPage = () => {
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

  if (loading) return <SkeletonList rows={5} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Security & Audit</h1>
        <p className="page-subtitle">A record of your interactions with patient data. Every action is logged and anchored on the ledger.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-8 w-8" />}
          title="No activity yet"
          description="Actions you take (viewing records, reviewing access requests, writing prescriptions) will appear here."
        />
      ) : (
        <Card>
          <CardContent>
            <ul className="divide-y divide-ink-200">
              {events.map((e) => (
                <li key={e._id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-ink-800">
                      <span className="font-medium">{e.action}</span>
                      {e.patientId && (
                        <span className="text-ink-500"> · Patient {e.patientId.slice(-5).toUpperCase()}</span>
                      )}
                    </p>
                    {e.details && Object.keys(e.details).length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {Object.entries(e.details as Record<string, unknown>)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-ink-500">{formatDateTime(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};