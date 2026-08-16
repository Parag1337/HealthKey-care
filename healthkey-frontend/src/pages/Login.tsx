import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, CalendarCheck, FileCheck2, HeartPulse, Lock, Mail, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { message?: string } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'doctor' ? '/doctor/overview' : '/dashboard/overview', {
        replace: true,
        state: { welcome: true }
      });
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not sign in. Please try again.');
      setError(
        msg.includes('incorrect')
          ? 'The email or password is incorrect.'
          : msg.includes('unavailable') || msg.includes('reach the server')
            ? 'HealthKey is temporarily unavailable. Please try again in a moment.'
            : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fafaf9]">
      {/* Story panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-brand-700 lg:block">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-600/60 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-800/80 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">HealthKey</span>
          </Link>

          <div>
            <h1 className="max-w-md font-display text-4xl font-semibold leading-[1.15] text-white">
              Welcome back. Your health is in good hands.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-brand-100">
              Appointments, records, and consent — all in one calm, private place.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: <CalendarCheck className="h-4 w-4" />, t: 'Book consultations in seconds' },
                { icon: <FileCheck2 className="h-4 w-4" />, t: 'Your records, always at hand' },
                { icon: <Share2 className="h-4 w-4" />, t: 'Consent-based sharing with doctors' }
              ].map((f) => (
                <li key={f.t} className="flex items-center gap-2.5 text-sm text-white/90">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">{f.icon}</span>
                  {f.t}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-brand-200">© {new Date().getFullYear()} HealthKey</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>

          <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink-800">Welcome back.</h2>
          <p className="mt-2 text-sm text-ink-500">Sign in to your HealthKey account.</p>

          {location.state?.message && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {location.state.message}
            </div>
          )}
          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Email" required>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@example.com"
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
            <div className="flex justify-end">
              <span className="cursor-not-allowed text-xs text-ink-400" title="Password reset is coming soon">
                Forgot password?
              </span>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-500">
            Don’t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
              Create patient account
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-ink-400">
            A healthcare professional?{' '}
            <Link to="/doctor-login" className="font-medium text-ink-600 underline-offset-2 hover:underline">
              Sign in as a doctor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}