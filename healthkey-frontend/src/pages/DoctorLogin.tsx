import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList, Lock, Mail, Stethoscope, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';

export default function DoctorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== 'doctor') {
        setError('This portal is for healthcare professionals. Patients, please sign in on the patient page.');
        setLoading(false);
        return;
      }
      navigate('/doctor/overview', { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not sign in. Please try again.');
      setError(
        msg.includes('incorrect')
          ? 'The email or password is incorrect.'
          : msg.includes('unavailable') || msg.includes('reach the server')
            ? 'HealthKey is temporarily unavailable. Please try again in a moment.'
            : msg
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Clinical panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-ink-800 lg:block">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '22px 22px'
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-14">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">HealthKey</span>
            <span className="ml-1 rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-white/70">
              Doctor Portal
            </span>
          </Link>

          <div>
            <h1 className="max-w-md font-display text-4xl font-semibold leading-[1.15] text-white">
              Secure patient records at your fingertips.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
              Get instant access to authorized patient records, track consent, and practice medicine with full transparency.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: <Lock className="h-4 w-4" />, t: 'QR-based patient access' },
                { icon: <ClipboardList className="h-4 w-4" />, t: 'Complete patient records' },
                { icon: <UserRound className="h-4 w-4" />, t: 'Full audit trail for transparency' }
              ].map((f) => (
                <li key={f.t} className="flex items-center gap-2.5 text-sm text-white/90">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">{f.icon}</span>
                  {f.t}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/40">© {new Date().getFullYear()} HealthKey · For verified healthcare professionals</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-800 text-white">
              <Stethoscope className="h-4.5 w-4.5" />
            </span>
            <span className="text-[17px] font-semibold text-ink-800">HealthKey · Doctors</span>
          </Link>

          <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink-800">
            Welcome back, Doctor.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Access patient records, view consents, and manage your secure practice.
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Professional email" required>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="doctor@clinic.com"
                />
              </div>
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </Field>
            <Button type="submit" className="w-full bg-ink-800 hover:bg-ink-700" size="lg" loading={loading}>
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-500">
            New to HealthKey?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
              Register as a healthcare professional
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-ink-400">
            A patient?{' '}
            <Link to="/login" className="font-medium text-ink-600 underline-offset-2 hover:underline">
              Sign in as a patient
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}