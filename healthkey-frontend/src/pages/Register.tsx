import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Stethoscope, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { Logo } from '../components/brand/Logo';

type Role = 'patient' | 'doctor';

export default function Register() {
  const navigate = useNavigate();
  const { registerPatient, registerDoctor } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      if (role === 'patient') {
        await registerPatient({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        navigate('/dashboard/profile', { replace: true });
      } else {
        await registerDoctor({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          professional: {
            professionalTitle: 'Dr.',
            specialization: 'General Medicine',
            qualifications: [],
            yearsOfExperience: 0
          },
          practice: {
            clinicName: '',
            clinicAddress: '',
            city: '',
            consultationFee: 0,
            consultationTypes: ['in_person'],
            workingDays: []
          }
        });
        navigate('/doctor/profile', { replace: true });
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed. Please check your details.');
      setError(
        msg.includes('already exists') ? 'An account with this email already exists. Please sign in.' : msg
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf9] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between">
        <Link to="/" aria-label="HealthKey home">
          <Logo />
        </Link>
        <Link to="/login" className="text-sm font-medium text-ink-500 hover:text-ink-800">
          Already have an account? <span className="font-semibold text-brand-700">Sign in</span>
        </Link>
      </div>

      <div className="mx-auto mt-10 w-full max-w-xl flex-1">
        {role === null ? (
          <div className="rounded-3xl border border-ink-200 bg-white p-8 shadow-soft">
            <h1 className="font-display text-2xl font-semibold text-ink-800">Create your HealthKey account</h1>
            <p className="mt-2 text-sm text-ink-500">Choose how you'll use HealthKey to continue.</p>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => setRole('patient')}
                className="group flex w-full items-center gap-4 rounded-2xl border border-ink-200 p-5 text-left transition-all hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <UserRound className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-ink-800">I'm a patient</span>
                  <span className="block text-[13px] text-ink-500">Manage records, wearables, and grant doctor access securely</span>
                </span>
                <ArrowRight className="h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
              </button>
              <button
                onClick={() => setRole('doctor')}
                className="group flex w-full items-center gap-4 rounded-2xl border border-ink-200 p-5 text-left transition-all hover:border-ink-400 hover:bg-ink-50/60"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                  <Stethoscope className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-ink-800">I'm a doctor</span>
                  <span className="block text-[13px] text-ink-500">Access patient records securely via QR code consent</span>
                </span>
                <ArrowRight className="h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-ink-600" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-ink-200 bg-white p-8 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink-800">
                  {role === 'patient' ? 'Create patient account' : 'Create doctor account'}
                </h1>
                <p className="mt-1 text-sm text-ink-500">
                  Just the essentials to get started. You'll complete your profile next.
                </p>
              </div>
              <button
                onClick={() => setRole(null)}
                className="text-xs font-medium text-ink-400 hover:text-ink-700"
              >
                Change
              </button>
            </div>

            {error && (
              <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Full name" required>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder={role === 'patient' ? 'Your full name' : 'e.g. Dr. Ananya Sharma'}
                />
              </Field>
              <Field label="Email address" required>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Password" required hint="At least 6 characters">
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                      minLength={6}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </Field>
                <Field label="Confirm password" required>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                      minLength={6}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </Field>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Create Account <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-ink-400">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
