import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, QrCode, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { accessAPI, doctorAPI, getErrorMessage } from '../lib/api';
import { AccessPermissions, DURATION_OPTIONS, PERMISSION_LABELS, PERMISSION_KEYS, ResolvedDoctor } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Checkbox, Radio } from '../components/ui/Field';
import { formatDateTime } from '../lib/format';
import { cn } from '../lib/cn';

type PageState =
  | { kind: 'loading' }
  | { kind: 'resolving'; token: string }
  | { kind: 'invalid'; message: string }
  | { kind: 'already-active'; doctor: ResolvedDoctor; expiresAt?: string }
  | { kind: 'pending'; doctor: ResolvedDoctor; requestedAt?: string }
  | { kind: 'confirm'; doctor: ResolvedDoctor }
  | { kind: 'submitting'; doctor: ResolvedDoctor }
  | { kind: 'success'; doctor: ResolvedDoctor };

export const ConnectPage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [permissions, setPermissions] = useState<AccessPermissions>({
    records: true,
    prescriptions: true,
    vitals: true
  });
  const [duration, setDuration] = useState(24);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { next: location.pathname, message: 'Sign in to connect with this doctor.' } });
      return;
    }
    if (user.role !== 'patient') {
      setState({
        kind: 'invalid',
        message: 'This page is for patients. Sign in with a patient account to connect with a doctor.'
      });
      return;
    }
    if (!token) {
      setState({ kind: 'invalid', message: 'This QR link is incomplete or invalid.' });
      return;
    }
    setState({ kind: 'resolving', token });
  }, [authLoading, user, token, navigate, location.pathname]);

  const resolve = useCallback(
    async (t: string) => {
      setState({ kind: 'resolving', token: t });
      setError('');
      try {
        const res = await doctorAPI.resolveQr(t);
        const { doctor, hasActiveAccess, hasPendingRequest } = res.data;
        if (hasActiveAccess) {
          const active = await accessAPI.getActive();
          const mine = active.data.find((a) => a.doctorId === doctor.id);
          setState({
            kind: 'already-active',
            doctor,
            expiresAt: mine?.expiresAt
          });
        } else if (hasPendingRequest) {
          const reqs = await accessAPI.getMyRequests();
          const mine = reqs.data.find((r) => r.doctorId === doctor.id && r.status === 'pending');
          setState({ kind: 'pending', doctor, requestedAt: mine?.requestedAt });
        } else {
          setState({ kind: 'confirm', doctor });
        }
      } catch (err) {
        setState({ kind: 'invalid', message: getErrorMessage(err) });
      }
    },
    []
  );

  useEffect(() => {
    if (state.kind === 'resolving') resolve(state.token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind === 'resolving' ? state.token : null]);

  const submit = async () => {
    if (state.kind !== 'confirm') return;
    setState({ kind: 'submitting', doctor: state.doctor });
    setError('');
    try {
      await accessAPI.request({
        qrToken: token,
        permissions,
        requestedHours: duration
      });
      setState({ kind: 'success', doctor: state.doctor });
    } catch (err) {
      setError(getErrorMessage(err));
      setState({ kind: 'confirm', doctor: state.doctor });
    }
  };

  const title = useMemo(() => state.kind === 'confirm' ? 'Connect to Doctor' : 'HealthKey Connect', [state.kind]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 text-ink-500">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 py-10">
      <div className="mx-auto max-w-lg space-y-5 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <QrCode className="h-4 w-4 text-white" />
          </div>
          <div>
            <Link to="/" className="text-sm font-bold text-ink-800 hover:text-brand-600">HealthKey</Link>
            <p className="text-[10px] uppercase tracking-wider text-ink-400">Secure Doctor Connect</p>
          </div>
        </div>

        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">
            This link identifies a doctor. Nothing is shared until you explicitly consent.
          </p>
        </div>

        {state.kind === 'loading' || state.kind === 'resolving' ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-sm text-ink-500">Contacting HealthKey…</p>
            </CardContent>
          </Card>
        ) : null}

        {state.kind === 'invalid' && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-600/80" />
              <p className="text-sm text-ink-600">{state.message}</p>
              <p className="max-w-sm text-xs text-ink-400">
                QR codes expire and can be regenerated. Ask the doctor to open their My QR screen to generate a fresh one.
              </p>
              <Link to="/dashboard/connect">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to scanner
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {state.kind === 'already-active' && (
          <Card>
            <CardContent className="space-y-3 py-6 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
              <p className="text-sm font-semibold text-ink-800">You are already connected</p>
              <p className="text-sm text-ink-500">
                You already have active consent with <span className="font-medium text-ink-700">{state.doctor.name}</span>.
              </p>
              {state.expiresAt && (
                <p className="text-xs text-ink-400">Expires {formatDateTime(state.expiresAt)}</p>
              )}
              <div className="flex justify-center gap-2 pt-2">
                <Link to="/dashboard/access">
                  <Button size="sm">Manage access</Button>
                </Link>
                <Link to="/dashboard/connect">
                  <Button variant="outline" size="sm">Scan another</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {state.kind === 'pending' && (
          <Card>
            <CardContent className="space-y-3 py-6 text-center">
              <Loader2 className="mx-auto h-8 w-8 text-amber-600" />
              <p className="text-sm font-semibold text-ink-800">Request already pending</p>
              <p className="text-sm text-ink-500">
                You already sent an access request to <span className="font-medium text-ink-700">{state.doctor.name}</span>.{' '}
                Please wait for the doctor to respond.
              </p>
              {state.requestedAt && <p className="text-xs text-ink-400">Requested {formatDateTime(state.requestedAt)}</p>}
              <Link to="/dashboard/access">
                <Button size="sm">View request status</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {state.kind === 'confirm' && (
          <>
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-100">
                  <User className="h-6 w-6 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink-800">{state.doctor.name}</p>
                  <p className="text-xs text-ink-400">
                    {state.doctor.specialization || 'Doctor'}
                    {state.doctor.hospital ? ` · ${state.doctor.hospital}` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-5">
                <div>
                  <p className="stat-label mb-3">What do you want to share?</p>
                  <div className="space-y-2.5">
                    {PERMISSION_KEYS.map((key) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink-200 bg-white px-3.5 py-3 hover:border-ink-300"
                      >
                        <Checkbox
                          checked={permissions[key]}
                          onChange={(e) => setPermissions((p) => ({ ...p, [key]: e.target.checked }))}
                        />
                        <span className="text-sm text-ink-700">{PERMISSION_LABELS[key]}</span>
                      </label>
                    ))}
                  </div>
                  {!permissions.records && !permissions.prescriptions && !permissions.vitals && (
                    <p className="mt-2 text-xs text-red-600">Select at least one type of information to share.</p>
                  )}
                </div>

                <div>
                  <p className="stat-label mb-3">Access duration</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {DURATION_OPTIONS.map((d) => (
                      <label
                        key={d.hours}
                        className={cn(
                          'flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors',
                          duration === d.hours
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
                        )}
                      >
                        <Radio
                          checked={duration === d.hours}
                          onChange={() => setDuration(d.hours)}
                          className="sr-only"
                        />
                        {d.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-3">
                  <p className="flex items-center gap-2 text-xs text-ink-500">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    You can revoke this access at any time from Access Control. Every view is recorded in your audit history.
                  </p>
                </div>

                {error && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button onClick={submit} loading={false} disabled={!permissions.records && !permissions.prescriptions && !permissions.vitals}>
                    Send Access Request
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/dashboard/connect')}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {state.kind === 'submitting' && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-sm text-ink-500">Sending your access request…</p>
            </CardContent>
          </Card>
        )}

        {state.kind === 'success' && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-700" />
              <p className="text-sm font-semibold text-ink-800">Access request sent</p>
              <p className="max-w-sm text-sm text-ink-500">
                <span className="font-medium text-ink-700">{state.doctor.name}</span> will see your request in their
                dashboard. You will be notified here when they approve or deny it.
              </p>
              <div className="flex gap-2 pt-2">
                <Link to="/dashboard/access">
                  <Button size="sm">View my requests</Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm">Go to dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};