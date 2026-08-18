import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { Logo } from '../../components/brand/Logo';

interface ProfileData {
  dateOfBirth: string;
  sex: string;
  bloodGroup: string;
  city: string;
  phone: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    dateOfBirth: '',
    sex: '',
    bloodGroup: '',
    city: '',
    phone: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Call API to update patient profile
      // await patientProfileAPI.update(profileData);
      
      setCompleted(true);
      setTimeout(() => {
        navigate('/dashboard/overview', { replace: true });
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
            <h1 className="font-display text-2xl font-semibold text-ink-800">Complete your profile</h1>
            <p className="mt-2 text-sm text-ink-500">Add your health information to get the most out of HealthKey.</p>
          </div>

          {completed && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
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
              <h2 className="mb-4 text-sm font-semibold text-ink-700">Health Information</h2>
              <div className="space-y-4 rounded-2xl border border-ink-200 bg-ink-50/30 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Date of birth">
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={profileData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </Field>
                  <Field label="Sex">
                    <select
                      name="sex"
                      value={profileData.sex}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder-ink-400 transition-colors hover:border-ink-300 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-100"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Blood group">
                    <Input
                      name="bloodGroup"
                      value={profileData.bloodGroup}
                      onChange={handleChange}
                      placeholder="e.g. O+"
                    />
                  </Field>
                  <Field label="City">
                    <Input
                      name="city"
                      value={profileData.city}
                      onChange={handleChange}
                      placeholder="e.g. Pune"
                    />
                  </Field>
                </div>
                <Field label="Known allergies" hint="Comma separated">
                  <Input
                    name="allergies"
                    value={profileData.allergies}
                    onChange={handleChange}
                    placeholder="e.g. penicillin, latex"
                  />
                </Field>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-semibold text-ink-700">Contact Information</h2>
              <div className="space-y-4 rounded-2xl border border-ink-200 bg-ink-50/30 p-5">
                <Field label="Phone number">
                  <Input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </Field>
                <Field label="Emergency contact name">
                  <Input
                    name="emergencyContact"
                    value={profileData.emergencyContact}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                  />
                </Field>
                <Field label="Emergency contact phone">
                  <Input
                    type="tel"
                    name="emergencyPhone"
                    value={profileData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/dashboard/overview', { replace: true })}
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
