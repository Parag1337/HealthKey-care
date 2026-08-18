import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Check, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { Logo } from '../../components/brand/Logo';

interface DoctorProfileData {
  title: string;
  specialization: string;
  qualifications: string;
  yearsOfExperience: string;
  registrationNumber: string;
  registrationState: string;
  clinicName: string;
  clinicAddress: string;
  city: string;
  consultationFee: string;
  slotDurationMinutes: string;
  workingDays: {
    [key: string]: { enabled: boolean; start: string; end: string };
  };
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS: { [key: string]: string } = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday'
};

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<DoctorProfileData>({
    title: 'Dr.',
    specialization: '',
    qualifications: '',
    yearsOfExperience: '',
    registrationNumber: '',
    registrationState: '',
    clinicName: '',
    clinicAddress: '',
    city: '',
    consultationFee: '',
    slotDurationMinutes: '30',
    workingDays: DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: {
        enabled: ['MON', 'TUE', 'WED', 'THU', 'FRI'].includes(day),
        start: '09:00',
        end: '17:00'
      }
    }), {})
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!user) {
    navigate('/register');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkingDayChange = (day: string, field: 'enabled' | 'start' | 'end', value: any) => {
    setProfileData(prev => ({
      ...prev,
      workingDays: {
        ...prev.workingDays,
        [day]: {
          ...prev.workingDays[day],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Call API to update doctor profile
      // await doctorProfileAPI.update(profileData);
      
      setCompleted(true);
      setTimeout(() => {
        navigate('/doctor/overview', { replace: true });
      }, 1500);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to save profile. Please try again.');
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf9] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <Logo />
        </div>

        <div className="rounded-3xl border border-ink-200 bg-white p-8 shadow-soft">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold text-ink-800">Complete your professional profile</h1>
            <p className="mt-2 text-sm text-ink-500">Add your professional details and availability to start receiving patient access requests.</p>
          </div>

          {completed && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2 mb-6">
              <Check className="h-4 w-4" />
              Profile saved successfully! Redirecting to your dashboard...
            </div>
          )}

          {error && !completed && (
            <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="mb-4 text-sm font-semibold text-ink-700">Professional Information</h2>
              <div className="space-y-4 rounded-2xl border border-ink-200 bg-ink-50/30 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Title">
                    <Input
                      name="title"
                      value={profileData.title}
                      onChange={handleChange}
                      placeholder="e.g. Dr."
                    />
                  </Field>
                  <Field label="Specialization" required>
                    <Input
                      name="specialization"
                      value={profileData.specialization}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Cardiology"
                    />
                  </Field>
                  <Field label="Qualifications" hint="Comma separated">
                    <Input
                      name="qualifications"
                      value={profileData.qualifications}
                      onChange={handleChange}
                      placeholder="e.g. MBBS, MD, DM"
                    />
                  </Field>
                  <Field label="Years of experience">
                    <Input
                      type="number"
                      name="yearsOfExperience"
                      value={profileData.yearsOfExperience}
                      onChange={handleChange}
                      min="0"
                      max="60"
                      placeholder="e.g. 10"
                    />
                  </Field>
                  <Field label="Registration number" required>
                    <Input
                      name="registrationNumber"
                      value={profileData.registrationNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g. MCI123456"
                    />
                  </Field>
                  <Field label="Registration state" required>
                    <Input
                      name="registrationState"
                      value={profileData.registrationState}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Maharashtra"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-semibold text-ink-700">Practice Information</h2>
              <div className="space-y-4 rounded-2xl border border-ink-200 bg-ink-50/30 p-5">
                <Field label="Clinic name">
                  <Input
                    name="clinicName"
                    value={profileData.clinicName}
                    onChange={handleChange}
                    placeholder="e.g. Sharma Cardiac Clinic"
                  />
                </Field>
                <Field label="Clinic address">
                  <Input
                    name="clinicAddress"
                    value={profileData.clinicAddress}
                    onChange={handleChange}
                    placeholder="Street address"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="City">
                    <Input
                      name="city"
                      value={profileData.city}
                      onChange={handleChange}
                      placeholder="e.g. Pune"
                    />
                  </Field>
                  <Field label="Consultation fee (₹)">
                    <Input
                      type="number"
                      name="consultationFee"
                      value={profileData.consultationFee}
                      onChange={handleChange}
                      min="0"
                      placeholder="e.g. 500"
                    />
                  </Field>
                </div>
                <Field label="Appointment slot duration">
                  <select
                    name="slotDurationMinutes"
                    value={profileData.slotDurationMinutes}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder-ink-400 transition-colors hover:border-ink-300 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-100"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </Field>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-semibold text-ink-700">Working Hours</h2>
              <div className="space-y-3 rounded-2xl border border-ink-200 bg-ink-50/30 p-5">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-3.5 py-3">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.workingDays[day].enabled}
                        onChange={(e) => handleWorkingDayChange(day, 'enabled', e.target.checked)}
                        className="h-4 w-4 accent-brand-600"
                      />
                      <span className="w-24 text-sm font-medium text-ink-700">{DAY_LABELS[day]}</span>
                    </label>
                    {profileData.workingDays[day].enabled && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-ink-400" />
                        <input
                          type="time"
                          value={profileData.workingDays[day].start}
                          onChange={(e) => handleWorkingDayChange(day, 'start', e.target.value)}
                          className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700"
                        />
                        <span className="text-ink-300">–</span>
                        <input
                          type="time"
                          value={profileData.workingDays[day].end}
                          onChange={(e) => handleWorkingDayChange(day, 'end', e.target.value)}
                          className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/doctor/overview', { replace: true })}
                disabled={loading}
              >
                Skip for now
              </Button>
              <Button type="submit" size="lg" loading={loading} disabled={completed} className="flex-1">
                Save & Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
