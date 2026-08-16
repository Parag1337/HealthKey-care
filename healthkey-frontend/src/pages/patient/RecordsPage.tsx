import { useCallback, useEffect, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { getErrorMessage, recordsAPI } from '../../lib/api';
import { MedicalRecord } from '../../types';
import { Button } from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { UploadRecordModal } from '../../components/records/UploadRecordModal';
import { RecordCard, RecordViewerModal, VerifyModal } from '../../components/records/RecordCard';

export const PatientRecordsPage = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState<MedicalRecord | null>(null);
  const [verifying, setVerifying] = useState<MedicalRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await recordsAPI.getMyRecords();
      setRecords(res.data);
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
          <h1 className="page-title">Medical Records</h1>
          <p className="page-subtitle">Your medical documents are stored securely and protected by integrity hashes.</p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" /> Upload Record
        </Button>
      </div>

      {loading && <SkeletonList rows={4} />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && records.length === 0 && (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No medical records yet"
          description="Upload PDFs or images of prescriptions, lab reports, scans and other documents. Every upload gets a SHA-256 integrity hash."
          actionLabel="Upload your first record"
          onAction={() => setUploadOpen(true)}
        />
      )}
      {!loading && !error && records.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {records.map((r) => (
            <RecordCard
              key={r._id}
              record={r}
              onView={setViewing}
              onVerify={setVerifying}
            />
          ))}
        </div>
      )}

      <UploadRecordModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={load} />
      <RecordViewerModal record={viewing} onClose={() => setViewing(null)} />
      <VerifyModal record={verifying} onClose={() => setVerifying(null)} />
    </div>
  );
};