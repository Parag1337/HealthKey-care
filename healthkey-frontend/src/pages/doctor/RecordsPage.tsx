import { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { getErrorMessage, recordsAPI } from '../../lib/api';
import { MedicalRecord } from '../../types';
import { Select } from '../../components/ui/Field';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { RecordCard, RecordViewerModal, NoAccessNotice } from '../../components/records/RecordCard';
import { useActiveAccessPermissions } from '../../hooks/useActiveAccess';

export const DoctorRecordsPage = () => {
  const { patients, loading: loadingPatients, hasPermission } = useActiveAccessPermissions();
  const [patientId, setPatientId] = useState('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setPatientId(patients[0].patientId);
    }
  }, [patients, patientId]);

  const load = useCallback(
    async (id: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await recordsAPI.getPatientRecords(id);
        setRecords(res.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load records.'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (patientId) load(patientId);
  }, [patientId, load]);

  const selected = patients.find((p) => p.patientId === patientId);
  const recordsAllowed = selected ? hasPermission('records', selected) : false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Medical Records</h1>
        <p className="page-subtitle">Documents shared by consented patients.</p>
      </div>

      {loadingPatients ? (
        <SkeletonList rows={2} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No consented patients"
          description="Records appear here once a patient approves access that includes Medical Records."
        />
      ) : (
        <>
          <div className="max-w-sm">
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} aria-label="Select patient">
              {patients.map((p) => (
                <option key={p._id} value={p.patientId}>
                  {p.patient?.name || `Patient ${p.patientId.slice(-5).toUpperCase()}`}
                </option>
              ))}
            </Select>
          </div>

          {!recordsAllowed ? (
            <NoAccessNotice label="Medical Records" />
          ) : loading ? (
            <SkeletonList rows={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => patientId && load(patientId)} />
          ) : records.length === 0 ? (
            <EmptyState title="No records shared" description="This patient has not uploaded any medical records yet." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {records.map((r) => (
                <RecordCard key={r._id} record={r} onView={setViewing} />
              ))}
            </div>
          )}
        </>
      )}

      <RecordViewerModal record={viewing} onClose={() => setViewing(null)} />
    </div>
  );
};