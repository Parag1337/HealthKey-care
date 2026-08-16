import { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { getErrorMessage, prescriptionsAPI } from '../../lib/api';
import { Prescription } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { formatDateTime } from '../../lib/format';

export const PatientPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await prescriptionsAPI.getMyPrescriptions();
      setPrescriptions(res.data);
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
        <h1 className="page-title">Prescriptions</h1>
        <p className="page-subtitle">Medicines prescribed to you by authorized doctors.</p>
      </div>

      {loading && <SkeletonList rows={3} />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && prescriptions.length === 0 && (
        <EmptyState
          icon={<ScrollText className="h-8 w-8" />}
          title="No prescriptions yet"
          description="When a doctor with your consent writes a prescription, it will appear here with its integrity hash."
        />
      )}
      {!loading && !error && prescriptions.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {prescriptions.map((p) => (
            <Card key={p._id}>
              <CardHeader>
                <div>
                  <CardTitle>{p.diagnosis}</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-400">
                    Dr. {p.doctor?.name || '—'} · {formatDateTime(p.createdAt)}
                  </p>
                </div>
                <Badge variant="success">✓ Verified</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {p.medicines.map((m, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 rounded-lg bg-ink-100/60 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-ink-800">{m.name}</p>
                        <p className="text-xs text-ink-400">
                          {[m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ')}
                        </p>
                        {m.instructions && (
                          <p className="mt-0.5 text-[11px] text-emerald-700/80">{m.instructions}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {p.notes && (
                  <p className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-500">
                    {p.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};