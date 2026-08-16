import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  FileText,
  HeartPulse,
  QrCode,
  ScrollText,
  ShieldCheck,
  FileClock
} from 'lucide-react';
import {
  accessAPI,
  auditAPI,
  getErrorMessage,
  recordsAPI,
  prescriptionsAPI,
  vitalsAPI
} from '../../lib/api';
import { AccessRequest, AuditEvent, MedicalRecord, Prescription, Vital } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/Feedback';
import { formatDate, formatDateTime, countdownLabel } from '../../lib/format';
import { AccessStatusBadge } from '../../components/ui/StatusBadge';
import { IntegrityBadge } from '../../components/records/RecordCard';
import { RECORD_CATEGORY_LABELS } from '../../types';

function StatCard({
  icon,
  label,
  value,
  to,
  accent
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  to?: string;
  accent?: string;
}) {
  const inner = (
    <Card className="h-full transition-colors hover:border-ink-300">
      <CardContent className="flex items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent || 'bg-ink-100 text-ink-500'}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="stat-label truncate">{label}</p>
          <p className="stat-value">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
  return to ? (
    <Link to={to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-xl">
      {inner}
    </Link>
  ) : inner;
}

export const PatientOverviewPage = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [activeAccess, setActiveAccess] = useState<AccessRequest[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, p, v, a, au] = await Promise.all([
        recordsAPI.getMyRecords(),
        prescriptionsAPI.getMyPrescriptions(),
        vitalsAPI.getMyVitals(),
        accessAPI.getActive(),
        auditAPI.getMyAudit()
      ]);
      setRecords(r.data);
      setPrescriptions(p.data);
      setVitals(v.data);
      setActiveAccess(a.data);
      setAudit(au.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-ink-100" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  const latestVital = vitals[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Here is your health at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<FileText className="h-5 w-5" />} label="Medical Records" value={records.length} to="/dashboard/records" accent="bg-emerald-50 text-emerald-700" />
        <StatCard icon={<ScrollText className="h-5 w-5" />} label="Prescriptions" value={prescriptions.length} to="/dashboard/prescriptions" accent="bg-sky-50 text-sky-700" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Vital Readings" value={vitals.length} to="/dashboard/vitals" accent="bg-violet-50 text-violet-700" />
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Active Access" value={activeAccess.length} to="/dashboard/access" accent="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Medical Records</CardTitle>
            <Link to="/dashboard/records" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">
                No records yet. <Link to="/dashboard/records" className="text-emerald-600 underline-offset-2 hover:underline">Upload your first document</Link>.
              </p>
            ) : (
              <ul className="divide-y divide-ink-200">
                {records.slice(0, 4).map((r) => (
                  <li key={r._id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-700">{r.title}</p>
                      <p className="text-xs text-ink-400">{RECORD_CATEGORY_LABELS[r.category]} · {formatDate(r.createdAt)}</p>
                    </div>
                    <IntegrityBadge status={r.verificationStatus} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Latest Vitals</CardTitle>
              <Link to="/dashboard/vitals" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                <HeartPulse className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {latestVital ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Heart rate', value: latestVital.heartRate ? `${latestVital.heartRate}` : null, unit: 'BPM' },
                    { label: 'SpO₂', value: latestVital.spo2 ? `${latestVital.spo2}` : null, unit: '%' },
                    { label: 'Temp', value: latestVital.temperature ? `${latestVital.temperature}` : null, unit: '°C' }
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-ink-100/60 p-3 text-center">
                      <p className="text-lg font-bold text-ink-800">{s.value ?? '—'} <span className="text-xs font-normal text-ink-400">{s.unit}</span></p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-ink-400">No readings yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Doctor Access</CardTitle>
              <Link to="/dashboard/access" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                Manage
              </Link>
            </CardHeader>
            <CardContent>
              {activeAccess.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-ink-400">No active doctor access.</p>
                  <Link to="/dashboard/connect" className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
                    <QrCode className="h-3.5 w-3.5" /> Connect to Doctor
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAccess.slice(0, 2).map((a) => (
                    <div key={a._id} className="rounded-lg bg-ink-100/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink-700">{a.doctor?.name}</p>
                        <AccessStatusBadge status="approved" />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-400">
                        Expires {a.expiresAt ? `in ${countdownLabel(a.expiresAt)}` : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <Link to="/dashboard/audit" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
            <FileClock className="h-3.5 w-3.5" /> Full history
          </Link>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-400">No security events yet.</p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {audit.slice(0, 4).map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-700">{e.details?.title || e.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-ink-400">{e.actorName} · {formatDateTime(e.createdAt)}</p>
                  </div>
                  <span className="shrink-0 text-[11px] capitalize text-ink-400">{e.action.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};