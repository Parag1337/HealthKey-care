import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileUp, HeartPulse, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, doctorProfileAPI } from '../lib/api';
import { DAY_LABELS, DayCode } from '../types';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Field';
import { Logo } from '../components/brand/Logo';
import { cn } from '../lib/cn';
import { useToast } from '../components/ui/Toast';

const DAY_CODES: DayCode[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const PATIENT_STEPS = ['Account', 'About you', 'Emergency', 'Finish'];
const DOCTOR_STEPS = ['Account', 'Professional', 'Practice', 'Verification'];

type Role = 'patient' | 'doctor';

const inputCls = 'w-full';

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { registerPatient, registerDoctor } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = role === 'patient' ? PATIENT_STEPS : DOCTOR_STEPS;

  const go = (dir: 1 | -1) => setStep((s) => Math.min(Math.max(s + dir, 0), steps.length - 1));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (step < steps.length - 1) {
      go(1);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = new FormData(form);
      const base = {
        name: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        password: String(data.get('password') || ''),
        confirmPassword: String(data.get('confirmPassword') || ''),
        phone: String(data.get('phone') || '') || undefined
      };
      if (role === 'patient') {
        await registerPatient({
          ...base,
          profile: {
            city: String(data.get('city') || '') || undefined,
            sex: String(data.get('sex') || '') || undefined,
            dateOfBirth: String(data.get('dateOfBirth') || '') || undefined,
            bloodGroup: String(data.get('bloodGroup') || '') || undefined,
            allergies: String(data.get('allergies') || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          }
        });
        navigate('/dashboard/overview', { replace: true });
      } else {
        const workingDays = DAY_CODES.filter((d) => data.get(`has-${d}`) === 'on').map((day) => ({
          day,
          start: String(data.get(`start-${day}`) || '09:00'),
          end: String(data.get(`end-${day}`) || '17:00'),
          slotDurationMinutes: Number(data.get('slotDurationMinutes')) || 30,
          consultationTypes: ['in_person', 'online'] as ('in_person' | 'online')[]
        }));
        await registerDoctor({
          ...base,
          professional: {
            professionalTitle: String(data.get('professionalTitle') || 'Dr.') || undefined,
            specialization: String(data.get('specialization') || '') || undefined,
            qualifications: String(data.get('qualifications') || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            yearsOfExperience: Number(data.get('yearsOfExperience')) || undefined,
            registrationNumber: String(data.get('registrationNumber') || '') || undefined,
            registrationState: String(data.get('registrationState') || '') || undefined
          },
          practice: {
            clinicName: String(data.get('clinicName') || '') || undefined,
            clinicAddress: String(data.get('clinicAddress') || '') || undefined,
            city: String(data.get('city') || '') || undefined,
            consultationFee: Number(data.get('consultationFee')) || undefined,
            consultationTypes: ['in_person', 'online'],
            workingDays
          }
        });
        const file = (data.get('verificationDoc') as File | null) ?? null;
        if (file && file.size > 0) {
          try {
            const kind = String(data.get('docKind') || 'registration_certificate');
            await doctorProfileAPI.uploadVerificationDocument(kind, file);
          } catch {
            toast.info('Account created. You can upload verification documents from your profile.');
          }
        }
        navigate('/doctor/overview', { replace: true });
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
            <p className="mt-2 text-sm text-ink-500">Choose how you’ll use HealthKey to continue.</p>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => setRole('patient')}
                className="group flex w-full items-center gap-4 rounded-2xl border border-ink-200 p-5 text-left transition-all hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <UserRound className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-ink-800">I’m a patient</span>
                  <span className="block text-[13px] text-ink-500">Manage records, appointments, and consent</span>
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
                  <span className="block text-[15px] font-semibold text-ink-800">I’m a doctor</span>
                  <span className="block text-[13px] text-ink-500">Manage your practice, availability, and patients</span>
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
                  {role === 'patient' ? 'Patient account' : 'Doctor account'}
                </h1>
                <p className="mt-1 text-sm text-ink-500">
                  Step {step + 1} of {steps.length} — {steps[step]}
                </p>
              </div>
              <button
                onClick={() => {
                  setRole(null);
                  setStep(0);
                }}
                className="text-xs font-medium text-ink-400 hover:text-ink-700"
              >
                Change role
              </button>
            </div>

            <div className="mb-7 flex gap-1.5" aria-hidden>
              {steps.map((s, i) => (
                <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={cn(
                      'h-full rounded-full bg-brand-600 transition-all duration-500',
                      i <= step ? 'w-full' : 'w-0'
                    )}
                  />
                </div>
              ))}
            </div>

            {error && (
              <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={submit}>
              <input type="hidden" name="email" value="" />
              <div className={cn(step === 0 ? 'block' : 'hidden')}>
                <div className="space-y-4">
                  <Field label="Full name" required>
                    <Input name="name" className={inputCls} required placeholder={role === 'patient' ? 'Your full name' : 'e.g. Ananya Sharma'} />
                  </Field>
                  <Field label="Email" required>
                    <Input type="email" name="email" className={inputCls} required placeholder="you@example.com" />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Password" required hint="At least 6 characters">
                      <Input type="password" name="password" minLength={6} className={inputCls} required />
                    </Field>
                    <Field label="Confirm password" required>
                      <Input type="password" name="confirmPassword" minLength={6} className={inputCls} required />
                    </Field>
                  </div>
                </div>
              </div>

              {role === 'patient' ? (
                <>
                  <div className={cn(step === 1 ? 'block' : 'hidden')}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Date of birth">
                        <Input type="date" name="dateOfBirth" className={inputCls} />
                      </Field>
                      <Field label="Sex">
                        <Select name="sex" className={inputCls} defaultValue="">
                          <option value="">Prefer not to say</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </Select>
                      </Field>
                      <Field label="Blood group">
                        <Input name="bloodGroup" className={inputCls} placeholder="e.g. O+" />
                      </Field>
                      <Field label="City">
                        <Input name="city" className={inputCls} placeholder="e.g. Pune" />
                      </Field>
                    </div>
                  </div>
                  <div className={cn(step === 2 ? 'block' : 'hidden')}>
                    <div className="space-y-4">
                      <Field label="Phone (for appointment reminders)">
                        <Input type="tel" name="phone" className={inputCls} placeholder="98XXXXXXXX" />
                      </Field>
                      <Field label="Allergies" hint="Comma separated, e.g. penicillin, nuts">
                        <Input name="allergies" className={inputCls} placeholder="e.g. penicillin, latex" />
                      </Field>
                    </div>
                  </div>
                  <div className={cn(step === 3 ? 'block' : 'hidden')}>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4" /> You’re almost done
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-700/90">
                        Your account will be created with consent-based sharing and a full audit trail.
                        You can add records and book your first appointment right after.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={cn(step === 1 ? 'block' : 'hidden')}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Title">
                        <Input name="professionalTitle" defaultValue="Dr." className={inputCls} />
                      </Field>
                      <Field label="Specialization" required>
                        <Input name="specialization" className={inputCls} required placeholder="e.g. Cardiology" />
                      </Field>
                      <Field label="Qualifications" hint="Comma separated, e.g. MBBS, MD">
                        <Input name="qualifications" className={inputCls} placeholder="MBBS, MD" />
                      </Field>
                      <Field label="Years of experience">
                        <Input type="number" name="yearsOfExperience" min={0} max={60} className={inputCls} />
                      </Field>
                      <Field label="Registration number">
                        <Input name="registrationNumber" className={inputCls} />
                      </Field>
                      <Field label="Registration state">
                        <Input name="registrationState" className={inputCls} placeholder="e.g. Maharashtra" />
                      </Field>
                    </div>
                  </div>
                  <div className={cn(step === 2 ? 'block' : 'hidden')}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Clinic name">
                          <Input name="clinicName" className={inputCls} />
                        </Field>
                        <Field label="Clinic address">
                          <Input name="clinicAddress" className={inputCls} />
                        </Field>
                        <Field label="City">
                          <Input name="city" className={inputCls} />
                        </Field>
                        <Field label="Consultation fee (₹)">
                          <Input type="number" name="consultationFee" min={0} className={inputCls} />
                        </Field>
                      </div>
                      <Field label="Appointment slot length">
                        <Select name="slotDurationMinutes" className={inputCls} defaultValue="30">
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="45">45 minutes</option>
                          <option value="60">60 minutes</option>
                        </Select>
                      </Field>
                      <div>
                        <p className="mb-2 text-xs font-medium text-ink-600">Working days</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {DAY_CODES.map((d) => (
                            <label
                              key={d}
                              className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/50"
                            >
                              <input type="checkbox" name={`has-${d}`} className="h-4 w-4 accent-brand-600" defaultChecked={d === 'MON' || d === 'TUE' || d === 'WED' || d === 'THU' || d === 'FRI'} />
                              <span className="flex-1">{DAY_LABELS[d]}</span>
                              <span className="flex items-center gap-1.5">
                                <input
                                  type="time"
                                  name={`start-${d}`}
                                  defaultValue="09:00"
                                  className="rounded-md border border-ink-200 bg-white px-1.5 py-1 text-xs text-ink-700"
                                />
                                <span className="text-ink-300">–</span>
                                <input
                                  type="time"
                                  name={`end-${d}`}
                                  defaultValue="17:00"
                                  className="rounded-md border border-ink-200 bg-white px-1.5 py-1 text-xs text-ink-700"
                                />
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={cn(step === 3 ? 'block' : 'hidden')}>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-5">
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                          <ShieldCheck className="h-4 w-4 text-brand-600" /> Verification documents
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
                          You can upload your registration certificate, degree, or ID now — or do it later
                          from your profile. Your listing stays pending until documents are reviewed.
                        </p>
                      </div>
                      <Field label="Document type">
                        <Select name="docKind" className={inputCls} defaultValue="registration_certificate">
                          <option value="registration_certificate">Medical Registration Certificate</option>
                          <option value="degree">Degree Certificate</option>
                          <option value="identity">Government ID</option>
                          <option value="clinic_license">Clinic License</option>
                        </Select>
                      </Field>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-300 bg-white px-4 py-4 transition-colors hover:border-brand-400 hover:bg-brand-50/30">
                        <FileUp className="h-5 w-5 shrink-0 text-ink-400" />
                        <span className="text-sm text-ink-600">
                          Upload file <span className="text-ink-400">(PDF, PNG, JPG — up to 10 MB, optional now)</span>
                        </span>
                        <input type="file" name="verificationDoc" accept=".pdf,.png,.jpg,.jpeg" className="hidden" />
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" onClick={() => go(-1)} disabled={step === 0} className="items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="submit" size="lg" loading={loading}>
                  {step < steps.length - 1 ? (
                    <>
                      Continue <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> {role === 'patient' ? 'Create my account' : 'Create doctor account'}
                    </>
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-400">
              <HeartPulse className="h-3.5 w-3.5 text-brand-500" />
              Protected by consent-based access and a full audit trail.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}