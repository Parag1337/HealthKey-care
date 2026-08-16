import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, ScrollText } from 'lucide-react';
import { accessAPI, getErrorMessage, prescriptionsAPI } from '../../lib/api';
import { AccessRequest, Medicine, Prescription } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { formatDateTime } from '../../lib/format';

interface MedicineRow {
  key: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

let rowKey = 1;

export const DoctorPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const { success, error: toastError } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, a] = await Promise.all([prescriptionsAPI.getMyPrescriptions(), accessAPI.getActive()]);
      setPrescriptions(p.data);
      setPatients(a.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="page-subtitle">Medicines you have prescribed to consented patients.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={patients.length === 0}>
          <Plus className="h-4 w-4" /> New Prescription
        </Button>
      </div>

      {patients.length === 0 && createOpen && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
          You can only write prescriptions for patients with active consent including Prescriptions permission.
        </p>
      )}

      {loading && <SkeletonList rows={3} />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && prescriptions.length === 0 && (
        <EmptyState
          icon={<ScrollText className="h-8 w-8" />}
          title="No prescriptions written"
          description="Create a prescription for a patient who has granted you access. It will appear in their dashboard instantly."
          actionLabel={patients.length > 0 ? 'New Prescription' : undefined}
          onAction={patients.length > 0 ? () => setCreateOpen(true) : undefined}
        />
      )}
      {!loading && !error && prescriptions.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {prescriptions.map((p) => (
            <Card key={p._id}>
              <CardHeader>
                <div>
                  <CardTitle>{p.diagnosis}</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Patient {p.patientId.slice(-5).toUpperCase()} · {formatDateTime(p.createdAt)}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {p.medicines.map((m, i) => (
                    <li key={i} className="rounded-lg bg-ink-100/60 px-3 py-2 text-sm text-ink-600">
                      <span className="font-medium text-ink-800">{m.name}</span>
                      {m.dosage && <span className="text-ink-500"> — {m.dosage}</span>}
                      {[m.frequency, m.duration].filter(Boolean).length > 0 && (
                        <span className="text-ink-500"> ({[m.frequency, m.duration].filter(Boolean).join(', ')})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreatePrescriptionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        patients={patients}
        onCreated={() => {
          setCreateOpen(false);
          success('Prescription created. The patient can now see it.');
          load();
        }}
        onError={toastError}
      />
    </div>
  );
};

function CreatePrescriptionModal({
  open,
  onClose,
  patients,
  onCreated,
  onError
}: {
  open: boolean;
  onClose: () => void;
  patients: AccessRequest[];
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<MedicineRow[]>([{ key: rowKey++, name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPatientId(patients[0]?._id === undefined ? '' : patients[0].patientId || '');
    setDiagnosis('');
    setNotes('');
    setRows([{ key: rowKey++, name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  }, [open, patients]);

  const updateRow = (key: number, patch: Partial<MedicineRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((rs) => [...rs, { key: rowKey++, name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);

  const removeRow = (key: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));

  const handleSubmit = async () => {
    const medicines: Medicine[] = rows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        dosage: r.dosage.trim() || undefined,
        frequency: r.frequency.trim() || undefined,
        duration: r.duration.trim() || undefined,
        instructions: r.instructions.trim() || undefined
      }));

    if (!patientId || !diagnosis.trim()) {
      onError('Please select a patient and enter a diagnosis.');
      return;
    }
    if (medicines.length === 0) {
      onError('Add at least one medicine with a name.');
      return;
    }

    setSubmitting(true);
    try {
      await prescriptionsAPI.create({
        patientId,
        diagnosis: diagnosis.trim(),
        medicines,
        notes: notes.trim() || undefined
      });
      onCreated();
    } catch (err) {
      onError(getErrorMessage(err, 'Could not create prescription.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Prescription"
      description="Only patients with active Prescriptions consent can be prescribed."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Create Prescription
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Patient" required>
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Select a consented patient…</option>
              {patients.map((a) => (
                <option key={a._id} value={a.patientId}>
                  {a.patient?.name || `Patient ${a.patientId.slice(-5).toUpperCase()}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Diagnosis" required>
            <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute bronchitis" />
          </Field>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-ink-500">Medicines</p>
            <Button type="button" variant="ghost" size="sm" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" /> Add Medicine
            </Button>
          </div>

          {rows.map((r, idx) => (
            <div key={r.key} className="space-y-3 rounded-xl border border-ink-200 bg-white p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Medicine {idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeRow(r.key)}
                  disabled={rows.length === 1}
                  aria-label={`Remove medicine ${idx + 1}`}
                  className="rounded p-1 text-ink-500 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Medicine name" required>
                  <Input value={r.name} onChange={(e) => updateRow(r.key, { name: e.target.value })} placeholder="Amoxicillin" />
                </Field>
                <Field label="Dosage">
                  <Input value={r.dosage} onChange={(e) => updateRow(r.key, { dosage: e.target.value })} placeholder="500 mg" />
                </Field>
                <Field label="Frequency">
                  <Input value={r.frequency} onChange={(e) => updateRow(r.key, { frequency: e.target.value })} placeholder="Twice daily" />
                </Field>
                <Field label="Duration">
                  <Input value={r.duration} onChange={(e) => updateRow(r.key, { duration: e.target.value })} placeholder="5 days" />
                </Field>
              </div>
              <Field label="Instructions">
                <Input value={r.instructions} onChange={(e) => updateRow(r.key, { instructions: e.target.value })} placeholder="After meals, with water" />
              </Field>
            </div>
          ))}
        </div>

        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional instructions or follow-up notes…" />
        </Field>
      </div>
    </Modal>
  );
}