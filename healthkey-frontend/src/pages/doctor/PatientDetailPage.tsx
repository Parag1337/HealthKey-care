import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ScrollText,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  ArrowLeft
} from 'lucide-react';
import { getErrorMessage, recordsAPI, prescriptionsAPI, vitalsAPI } from '../../lib/api';
import { AccessRequest, MedicalRecord, Prescription, Vital, PERMISSION_LABELS, PERMISSION_KEYS } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/Feedback';
import { RecordCard, RecordViewerModal, NoAccessNotice } from '../../components/records/RecordCard';
import { useActiveAccessPermissions } from '../../hooks/useActiveAccess';
import { formatDateTime, countdownLabel } from '../../lib/format';

type Tab = 'overview' | 'records' | 'prescriptions' | 'vitals';

const TABS: { key: Tab; label: string; icon: React.ReactNode; permission: 'records' | 'prescriptions' | 'vitals' | null }[] = [
  { key: 'overview', label: 'Overview & Access', icon: <ShieldCheck className="h-4 w-4" />, permission: null },
  { key: 'records', label: 'Medical Records', icon: <FileText className="h-4 w-4" />, permission: 'records' },
  { key: 'prescriptions', label: 'Prescriptions', icon: <ScrollText className="h-4 w-4" />, permission: 'prescriptions' },
  { key: 'vitals', label: 'Vitals', icon: <HeartPulse className="h-4 w-4" />, permission: 'vitals' }
];

export const DoctorPatientDetailPage = () => {
  const { patientId = '' } = useParams<{ patientId: string }>();
  const { patients, loading, error, hasPermission, reload } = useActiveAccessPermissions();
  const [tab, setTab] = useState<Tab>('overview');

  const request = patients.find((p) => p.patientId === patientId) || null;
  const active = request && request.status === 'approved';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/doctor/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="page-title">{active ? request?.patient?.name || 'Patient' : 'Patient Detail'}</h1>
        <p className="page-subtitle">{request?.patient?.email || ''}</p>
      </div>

      {loading && <SkeletonList rows={2} />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && !request && (
        <p className="text-sm text-ink-500">
          No active access found for this patient. They must approve an access request including the permissions you need.
        </p>
      )}

      {!loading && !error && request && (
        <>
          {active ? (
            <div className="rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-600">
              <p>
                <span className="font-medium text-ink-800">
                  {request.patient?.name || 'Patient'} has approved access
                </span>{' '}
                for the next {countdownLabel(request.expiresAt || '')}{' '}
                <span className="text-ink-500">(until {formatDateTime(request.expiresAt || '')})</span>.
              </p>
              <p className="mt-1 text-ink-500">Only the permissions listed below are visible to you.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <p>
                Consent is <span className="font-semibold">{request.status}</span>. The patient has not approved your
                access yet — ask them to scan your QR code again.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => {
              const allowed = t.permission ? hasPermission(t.permission, request) : true;
              return (
                <Button
                  key={t.key}
                  variant={tab === t.key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTab(t.key)}
                  disabled={!allowed}
                  title={allowed ? undefined : `Requires "${PERMISSION_LABELS[t.permission!]}" consent`}
                >
                  {t.icon} {t.label}
                  {!allowed && <span className="ml-1 text-ink-500">(no consent)</span>}
                </Button>
              );
            })}
          </div>

          {tab === 'overview' && (
            <OverviewTab request={request} />
          )}
          {tab === 'records' && (
            <RecordsTab patientId={patientId} allowed={hasPermission('records', request)} />
          )}
          {tab === 'prescriptions' && (
            <PrescriptionsTab patientId={patientId} allowed={hasPermission('prescriptions', request)} />
          )}
          {tab === 'vitals' && (
            <VitalsTab patientId={patientId} allowed={hasPermission('vitals', request)} />
          )}
        </>
      )}
    </div>
  );
};

function OverviewTab({ request }: { request: AccessRequest }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-ink-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Patient</p>
        <div className="space-y-1.5 text-sm text-ink-600">
          <p className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-ink-500" /> {request.patient?.name || '—'}
          </p>
          {request.patient?.email && (
            <p className="text-ink-500">{request.patient.email}</p>
          )}
          <p className="text-xs text-ink-400">
            HealthKey Patient ID: <span className="font-mono">HK-PAT-{request.patientId.slice(-5).toUpperCase()}</span>
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-ink-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Access Details</p>
        <div className="space-y-1.5 text-sm text-ink-600">
          <p>Status: <Badge variant={request.status === 'approved' ? 'success' : 'neutral'}>{request.status.toUpperCase()}</Badge></p>
          <p>Requested: {formatDateTime(request.requestedAt)}</p>
          {request.approvedAt && <p>Approved: {formatDateTime(request.approvedAt)}</p>}
          {request.expiresAt && (
            <p>
              Expires: {formatDateTime(request.expiresAt)}{' '}
              <span className="text-ink-500">({countdownLabel(request.expiresAt)} left)</span>
            </p>
          )}
          {request.decidedAt && request.status === 'denied' && <p>Denied: {formatDateTime(request.decidedAt)}</p>}
          {request.revokedAt && request.status === 'revoked' && <p>Revoked: {formatDateTime(request.revokedAt)}</p>}
        </div>
      </div>
      <div className="rounded-xl border border-ink-200 bg-white p-4 lg:col-span-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Shared Permissions</p>
        <div className="flex flex-wrap gap-2">
          {PERMISSION_KEYS.map((k) => (
            <span
              key={k}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                request.permissions[k]
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-ink-100 text-ink-500 line-through'
              }`}
            >
              {request.permissions[k] ? '✓' : '✕'} {PERMISSION_LABELS[k]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordsTab({ patientId, allowed }: { patientId: string; allowed: boolean }) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await recordsAPI.getPatientRecords(patientId);
        if (!cancelled) setRecords(res.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, allowed]);

  if (!allowed) return <NoAccessNotice label="Medical Records" />;
  if (loading) return <SkeletonList rows={4} />;
  if (error) return <ErrorState message={error} />;
  if (records.length === 0) return <p className="text-sm text-ink-500">No records shared by this patient.</p>;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((r) => (
          <RecordCard key={r._id} record={r} onView={setViewing} />
        ))}
      </div>
      <RecordViewerModal record={viewing} onClose={() => setViewing(null)} />
    </>
  );
}

function PrescriptionsTab({ patientId, allowed }: { patientId: string; allowed: boolean }) {
  const [data, setData] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await prescriptionsAPI.getPatientPrescriptions(patientId);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, allowed]);

  if (!allowed) return <NoAccessNotice label="Prescriptions" />;
  if (loading) return <SkeletonList rows={3} />;
  if (error) return <ErrorState message={error} />;
  if (data.length === 0) return <p className="text-sm text-ink-500">No prescriptions for this patient yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {data.map((p) => (
        <div key={p._id} className="rounded-xl border border-ink-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-800">{p.diagnosis}</p>
            <span className="text-xs text-ink-500">{formatDateTime(p.createdAt)}</span>
          </div>
          <ul className="space-y-1.5">
            {p.medicines.map((m, i) => (
              <li key={i} className="text-sm text-ink-600">
                <span className="font-medium text-ink-800">{m.name}</span>
                {m.dosage && <span className="text-ink-500"> — {m.dosage}</span>}
                {[m.frequency, m.duration].filter(Boolean).length > 0 && (
                  <span className="text-ink-500"> ({[m.frequency, m.duration].filter(Boolean).join(', ')})</span>
                )}
              </li>
            ))}
          </ul>
          {p.notes && <p className="mt-2 text-xs italic text-ink-500">{p.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function VitalsTab({ patientId, allowed }: { patientId: string; allowed: boolean }) {
  const [data, setData] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await vitalsAPI.getPatientVitals(patientId);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, allowed]);

  if (!allowed) return <NoAccessNotice label="Vitals" />;
  if (loading) return <SkeletonList rows={3} />;
  if (error) return <ErrorState message={error} />;
  if (data.length === 0) return <p className="text-sm text-ink-500">No vital readings shared by this patient.</p>;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.slice(0, 12).map((v) => (
        <div key={v._id} className="rounded-xl border border-ink-200 bg-white p-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <HeartPulse className="h-4 w-4" />
            <span className="text-xs text-ink-500">{formatDateTime(v.createdAt)}</span>
          </div>
          <div className="mt-2 space-y-1 text-sm text-ink-600">
            {v.heartRate && <p>Heart rate: <span className="text-ink-800">{v.heartRate} BPM</span></p>}
            {v.spo2 && <p>SpO₂: <span className="text-ink-800">{v.spo2}%</span></p>}
            {v.bloodPressure && <p>Blood pressure: <span className="text-ink-800">{v.bloodPressure}</span></p>}
            {v.temperature && <p>Temperature: <span className="text-ink-800">{v.temperature}°C</span></p>}
            {v.glucose && <p>Glucose: <span className="text-ink-800">{v.glucose} mg/dL</span></p>}
            {!v.heartRate && !v.spo2 && !v.bloodPressure && !v.temperature && !v.glucose && (
              <p className="text-ink-500">No readings recorded</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}