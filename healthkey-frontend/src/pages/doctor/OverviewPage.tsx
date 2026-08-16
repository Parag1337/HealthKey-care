import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Link2, ScrollText, Users, QrCode } from 'lucide-react';
import { accessAPI, auditAPI, getErrorMessage, prescriptionsAPI } from '../../lib/api';
import { AccessRequest, AuditEvent, Prescription } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/Feedback';
import { AccessStatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime, countdownLabel } from '../../lib/format';

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
    <Link to={to} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
      {inner}
    </Link>
  ) : inner;
}

export const DoctorOverviewPage = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, p, a] = await Promise.all([
        accessAPI.getDoctorRequests(),
        prescriptionsAPI.getMyPrescriptions(),
        auditAPI.getMyAudit()
      ]);
      setRequests(r.data);
      setPrescriptions(p.data);
      setAudit(a.data);
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
        <div className="h-8 w-52 animate-pulse rounded bg-ink-100" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  const pending = requests.filter((r) => r.status === 'pending');
  const active = requests.filter((r) => r.status === 'approved');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Doctor Overview</h1>
          <p className="page-subtitle">Manage patient access requests and monitor activity.</p>
        </div>
        <Link to="/doctor/qr">
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4" /> My HealthKey QR
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Connected Patients" value={active.length} to="/doctor/patients" accent="bg-emerald-50 text-emerald-700" />
        <StatCard icon={<Link2 className="h-5 w-5" />} label="Pending Requests" value={pending.length} to="/doctor/requests" accent="bg-amber-50 text-amber-700" />
        <StatCard icon={<ScrollText className="h-5 w-5" />} label="Prescriptions Written" value={prescriptions.length} to="/doctor/prescriptions" accent="bg-sky-50 text-sky-700" />
        <StatCard icon={<FileText className="h-5 w-5" />} label="Docs Viewed" value={audit.filter((e) => e.action === 'document_viewed').length} accent="bg-violet-50 text-violet-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Access Requests</CardTitle>
            <Link to="/doctor/requests" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-600">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-500">No pending requests. Share your QR code with patients to receive them.</p>
            ) : (
              <ul className="divide-y divide-ink-200">
                {pending.slice(0, 4).map((r) => (
                  <li key={r._id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800">{r.patient?.name || 'Patient'}</p>
                      <p className="text-xs text-ink-500">{formatDateTime(r.requestedAt)}</p>
                    </div>
                    <AccessStatusBadge status="pending" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <Link to="/doctor/audit" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-600">
              Full history <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-500">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-ink-200">
                {audit.slice(0, 5).map((e) => (
                  <li key={e._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm capitalize text-ink-800">{e.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-ink-500">{e.details?.title || ''} {formatDateTime(e.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Patient Access</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-500">
              No active access. Show your QR code to a patient so they can request access.
            </p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {active.slice(0, 5).map((a) => (
                <li key={a._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-800">{a.patient?.name || 'Patient'}</p>
                    <p className="text-xs text-ink-500">
                      {a.expiresAt ? `Expires in ${countdownLabel(a.expiresAt)}` : '—'} · requested {formatDateTime(a.requestedAt)}
                    </p>
                  </div>
                  <Link to={`/doctor/patients/${a.patientId}`}>
                    <Button size="sm" variant="outline">
                      View Patient
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};