import { useCallback, useEffect, useMemo, useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { getErrorMessage, vitalsAPI } from '../../lib/api';
import { Vital } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { formatDateTime } from '../../lib/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function latestValue(v: Vital | undefined, key: keyof Vital): number | null {
  if (!v) return null;
  const val = v[key];
  return typeof val === 'number' ? val : null;
}

export const PatientVitalsPage = () => {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vitalsAPI.getMyVitals();
      setVitals(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(
    () =>
      [...vitals]
        .reverse()
        .slice(-20)
        .map((v) => ({
          time: formatDateTime(v.createdAt),
          heartRate: v.heartRate ?? null,
          spo2: v.spo2 ?? null
        })),
    [vitals]
  );

  const latest = vitals[0];

  const tiles = [
    { label: 'Heart Rate', value: latestValue(latest, 'heartRate'), unit: 'BPM', icon: '❤️' },
    { label: 'SpO₂', value: latestValue(latest, 'spo2'), unit: '%', icon: '🫁' },
    { label: 'Temperature', value: latestValue(latest, 'temperature'), unit: '°C', icon: '🌡' },
    { label: 'Blood Pressure', value: latest?.bloodPressure ? 'BP' : null, raw: latest?.bloodPressure, unit: 'mmHg', icon: '🩺' }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Vitals</h1>
        <p className="page-subtitle">Tracked readings from your connected sources.</p>
      </div>

      {loading && <SkeletonList rows={3} />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && vitals.length === 0 && (
        <EmptyState
          icon={<HeartPulse className="h-8 w-8" />}
          title="No vital readings yet"
          description="Readings from your devices and manual entries will show up here with history charts."
        />
      )}

      {!loading && !error && vitals.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((t) => (
              <Card key={t.label}>
                <CardContent className="text-center">
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">{t.icon} {t.label}</p>
                  <p className="mt-1 text-2xl font-bold text-ink-800">
                    {t.raw ?? (t.value !== null ? t.value : '—')}
                    {t.value !== null && <span className="ml-0.5 text-xs font-normal text-ink-400">{t.unit}</span>}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fill: '#a8a29e', fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fill: '#a8a29e', fontSize: 10 }} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#ffffff', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#57534e' }}
                    />
                    <Line type="monotone" dataKey="heartRate" name="Heart rate" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="spo2" name="SpO₂" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-ink-200">
                {vitals.slice(0, 10).map((v) => (
                  <li key={v._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="text-ink-400">{formatDateTime(v.createdAt)}</span>
                    <span className="text-ink-700">
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
        </>
      )}
    </div>
  );
};