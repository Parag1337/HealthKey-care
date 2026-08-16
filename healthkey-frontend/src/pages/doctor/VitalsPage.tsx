import { useCallback, useEffect, useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { getErrorMessage, vitalsAPI } from '../../lib/api';
import { Vital } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { NoAccessNotice } from '../../components/records/RecordCard';
import { formatDateTime } from '../../lib/format';
import { useActiveAccessPermissions } from '../../hooks/useActiveAccess';

export const DoctorVitalsPage = () => {
  const { patients, loading: loadingPatients, hasPermission } = useActiveAccessPermissions();
  const [patientId, setPatientId] = useState('');
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setPatientId(patients[0].patientId);
    }
  }, [patients, patientId]);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await vitalsAPI.getPatientVitals(id);
      setVitals(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load vitals.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patientId) load(patientId);
  }, [patientId, load]);

  const selected = patients.find((p) => p.patientId === patientId);
  const vitalsAllowed = selected ? hasPermission('vitals', selected) : false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Vitals</h1>
        <p className="page-subtitle">Vital readings shared by consented patients.</p>
      </div>

      {loadingPatients ? (
        <SkeletonList rows={2} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<HeartPulse className="h-8 w-8" />}
          title="No consented patients"
          description="Vitals appear here once a patient approves access that includes Vitals."
        />
      ) : (
        <>
          <div className="max-w-sm">
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} aria-label="Select patient">
              {patients.map((p) => (
                <option key={p._id} value={p.patientId}>
                  {p.patient?.name || `Patient ${p.patientId.slice(-5).toUpperCase()}`}
                </option>
              ))}
            </Select>
          </div>

          {!vitalsAllowed ? (
            <NoAccessNotice label="Vitals" />
          ) : loading ? (
            <SkeletonList rows={3} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => patientId && load(patientId)} />
          ) : vitals.length === 0 ? (
            <EmptyState title="No vital readings" description="This patient has not shared any readings yet." />
          ) : (
            <Card>
              <CardContent>
                <ul className="divide-y divide-ink-200">
                  {vitals.slice(0, 20).map((v) => (
                    <li key={v._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                      <span className="text-ink-500">{formatDateTime(v.createdAt)}</span>
                      <span className="text-ink-800">
                        {[
                          v.heartRate ? `${v.heartRate} BPM` : null,
                          v.spo2 ? `SpO₂ ${v.spo2}%` : null,
                          v.temperature ? `${v.temperature}°C` : null,
                          v.bloodPressure || null
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};