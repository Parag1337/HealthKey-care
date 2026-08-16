import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, FileUp, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { doctorProfileAPI, getErrorMessage } from '../../lib/api';
import { AvailabilitySettings, DAY_LABELS, DayCode, DoctorProfileView, WorkingDayInput } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Field, Input, Select } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/format';

const DAYS: DayCode[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function emptyDay(day: DayCode): WorkingDayInput {
  return { day, start: '09:00', end: '17:00', slotDurationMinutes: 30, consultationTypes: ['in_person', 'online'] };
}

const DOC_KINDS = [
  { value: 'registration_certificate', label: 'Medical Registration Certificate' },
  { value: 'degree', label: 'Degree Certificate' },
  { value: 'identity', label: 'Government ID' },
  { value: 'clinic_license', label: 'Clinic License' }
];

export function DoctorProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<DoctorProfileView | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySettings>({ workingDays: [], blockedDates: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docKind, setDocKind] = useState('registration_certificate');
  const [blockedInput, setBlockedInput] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await doctorProfileAPI.getProfile();
      setProfile(res.data.profile);
      if (res.data.availability) {
        setAvailability({
          workingDays: res.data.availability.workingDays.map((w) => ({ ...w, breaks: w.breaks || [] })),
          blockedDates: res.data.availability.blockedDates || []
        });
      }
    } catch {
      toast.error('Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDay = (day: DayCode, patch: Partial<WorkingDayInput>) => {
    setAvailability((a) => ({
      ...a,
      workingDays: a.workingDays.map((w) => (w.day === day ? { ...w, ...patch } : w))
    }));
  };

  const toggleDay = (day: DayCode, on: boolean) => {
    setAvailability((a) => ({
      ...a,
      workingDays: on ? [...a.workingDays, emptyDay(day)] : a.workingDays.filter((w) => w.day !== day)
    }));
  };

  const addBlocked = () => {
    if (!blockedInput) return;
    setAvailability((a) => ({
      ...a,
      blockedDates: a.blockedDates.includes(blockedInput) ? a.blockedDates : [...a.blockedDates, blockedInput]
    }));
    setBlockedInput('');
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await doctorProfileAPI.updateAvailability({
        workingDays: availability.workingDays,
        blockedDates: availability.blockedDates
      });
      setAvailability({ workingDays: res.data.workingDays, blockedDates: res.data.blockedDates });
      toast.success('Availability saved.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save availability.'));
    } finally {
      setSaving(false);
    }
  };

  const uploadDoc = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await doctorProfileAPI.uploadVerificationDocument(docKind, file);
      toast.success('Document uploaded. Verification is pending review.');
      setProfile((p) =>
        p
          ? { ...p, verificationStatus: res.data.verificationStatus as DoctorProfileView['verificationStatus'] }
          : p
      );
      setFile(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-44 animate-pulse rounded-2xl border border-ink-200 bg-ink-100" />
        <div className="h-64 animate-pulse rounded-2xl border border-ink-200 bg-ink-100" />
      </div>
    );
  }

  const statusBadge =
    profile?.verificationStatus === 'verified' ? (
      <Badge variant="success">
        <ShieldCheck className="h-3 w-3" /> Verified
      </Badge>
    ) : profile?.verificationStatus === 'rejected' ? (
      <Badge variant="danger">Rejected</Badge>
    ) : (
      <Badge variant="warning">Pending verification</Badge>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Profile & Availability</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your practice details, working hours and verification.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle>Verification</CardTitle>
              <CardDescription>Upload your credentials to get the verified badge on your search listing.</CardDescription>
            </div>
            {statusBadge}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.verificationDocs?.length ? (
            <div className="space-y-1.5">
              {profile.verificationDocs.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm">
                  <span className="text-ink-700">{d.kind.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-ink-500">{formatDate(d.uploadedAt)}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Document type" className="w-64">
              <Select value={docKind} onChange={(e) => setDocKind(e.target.value)}>
                {DOC_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="File (PDF, PNG, JPG up to 10 MB)">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-700 hover:file:bg-ink-200"
              />
            </Field>
            <Button onClick={uploadDoc} loading={uploading} disabled={!file}>
              <FileUp className="h-4 w-4" /> Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle>Availability</CardTitle>
              <CardDescription>Patients can only book slots within these working hours.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {DAYS.map((day) => {
              const wd = availability.workingDays.find((w) => w.day === day);
              return (
                <div key={day} className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2.5">
                  <label className="flex w-32 items-center gap-2.5 text-sm font-medium text-ink-700">
                    <input
                      type="checkbox"
                      checked={!!wd}
                      onChange={(e) => toggleDay(day, e.target.checked)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    {DAY_LABELS[day]}
                  </label>
                  {wd && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={wd.start}
                          onChange={(e) => updateDay(day, { start: e.target.value })}
                          className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-800"
                        />
                        <span className="text-ink-300">–</span>
                        <input
                          type="time"
                          value={wd.end}
                          onChange={(e) => updateDay(day, { end: e.target.value })}
                          className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-800"
                        />
                      </div>
                      <Select
                        className="w-32 py-1.5"
                        value={String(wd.slotDurationMinutes || 30)}
                        onChange={(e) => updateDay(day, { slotDurationMinutes: Number(e.target.value) })}
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                      </Select>
                      <div className="flex items-center gap-3 text-xs text-ink-500">
                        {(['in_person', 'online'] as const).map((t) => (
                          <label key={t} className="flex cursor-pointer items-center gap-1.5 capitalize">
                            <input
                              type="checkbox"
                              checked={(wd.consultationTypes || []).includes(t)}
                              onChange={(e) =>
                                updateDay(day, {
                                  consultationTypes: e.target.checked
                                    ? [...(wd.consultationTypes || []), t]
                                    : (wd.consultationTypes || []).filter((x) => x !== t)
                                })
                              }
                              className="h-3.5 w-3.5 accent-brand-600"
                            />
                            {t.replace('_', ' ')}
                          </label>
                        ))}
                      </div>
                      <Button variant="ghost" size="icon" className="ml-auto" onClick={() => toggleDay(day, false)} aria-label={`Remove ${DAY_LABELS[day]}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-ink-200 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Blocked dates</p>
            <div className="flex flex-wrap items-center gap-2">
              {availability.blockedDates.map((d) => (
                <span key={d} className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs text-ink-700">
                  {formatDate(d)}
                  <button
                    onClick={() =>
                      setAvailability((a) => ({ ...a, blockedDates: a.blockedDates.filter((x) => x !== d) }))
                    }
                    aria-label={`Remove ${d}`}
                    className="text-ink-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-2">
                <Input type="date" value={blockedInput} onChange={(e) => setBlockedInput(e.target.value)} className="w-40" />
                <Button variant="outline" size="sm" onClick={addBlocked}>
                  <Plus className="h-3.5 w-3.5" /> Block
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-ink-200 pt-4">
            <Button onClick={save} loading={saving}>
              <Check className="h-4 w-4" /> Save availability
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}