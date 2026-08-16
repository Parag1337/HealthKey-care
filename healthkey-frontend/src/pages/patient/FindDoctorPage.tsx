import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, SlidersHorizontal, Stethoscope, IndianRupee, Award, CalendarClock } from 'lucide-react';
import { doctorSearchAPI, DoctorSearchParams } from '../../lib/api';
import { DoctorCard as DoctorCardType, AppointmentType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/format';

export function FindDoctorPage() {
  const [params, setParams] = useState<DoctorSearchParams>({});
  const [query, setQuery] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [doctors, setDoctors] = useState<DoctorCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async (p: DoctorSearchParams) => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorSearchAPI.search(p);
      setDoctors(res.data);
    } catch {
      setError('Could not load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(params);
  }, [params, load]);

  const apply = (patch: Partial<DoctorSearchParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
    setShowFilters(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Find a Doctor</h1>
        <p className="page-subtitle">Search by name, speciality or clinic and book a consultation.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: query || undefined });
          }}
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search speciality, doctor or clinic…"
            className="pl-10"
          />
        </form>
        <Button variant="secondary" onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-ink-200 bg-white p-4 sm:grid-cols-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-ink-500">Consultation Type</label>
            <Select
              value={params.type || ''}
              onChange={(e) => apply({ type: (e.target.value || undefined) as AppointmentType | undefined })}
            >
              <option value="">Any</option>
              <option value="in_person">In-person</option>
              <option value="online">Online</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-500">Max Fee (₹)</label>
            <Input
              type="number"
              min={0}
              value={maxFee}
              placeholder="Any"
              onChange={(e) => {
                setMaxFee(e.target.value);
                apply({ maxFee: e.target.value ? Number(e.target.value) : undefined });
              }}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={() => apply({ verifiedOnly: true })}>
              Verified only
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-ink-200 bg-ink-100" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card className="py-12 text-center">
          <Stethoscope className="mx-auto h-10 w-10 text-ink-200" />
          <p className="mt-3 text-sm text-ink-500">No doctors match your search.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {doctors.map((doc) => (
            <Link
              key={doc.id}
              to={`/dashboard/doctors/${doc.id}`}
              className="group rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-colors hover:border-ink-300 hover:bg-ink-50"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-ink-800 group-hover:text-emerald-700">
                      {doc.professionalTitle ? `${doc.professionalTitle} ` : ''}
                      {doc.name}
                    </h3>
                    {doc.verificationStatus === 'verified' && (
                      <Badge variant="success">Verified</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-500">{doc.specialization || 'General Practitioner'}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {doc.clinic?.name || 'Clinic'} − {doc.clinic?.city || '—'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                {doc.yearsOfExperience ? (
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> {doc.yearsOfExperience} yrs exp
                  </span>
                ) : null}
                {doc.consultationFee ? (
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" /> {doc.consultationFee}
                  </span>
                ) : null}
                {doc.consultationTypes?.map((t) => (
                  <span key={t} className="rounded-full border border-ink-200 px-2 py-0.5 capitalize text-ink-500">
                    {t.replace('_', ' ')}
                  </span>
                ))}
                {doc.nextAvailable && (
                  <span className="ml-auto flex items-center gap-1 text-emerald-700">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatDate(doc.nextAvailable.date, { day: 'numeric', month: 'short' })} {doc.nextAvailable.startTime}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}