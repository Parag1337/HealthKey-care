import { useEffect, useState } from 'react';
import { FileText, Eye, Loader2, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';
import { MedicalRecord, RECORD_CATEGORY_LABELS, VerificationResult } from '../../types';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatBytes, formatDate, formatDateTime, shortHash } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { getErrorMessage, blockchainAPI, recordsAPI } from '../../lib/api';

export function RecordCard({
  record,
  onView,
  onVerify
}: {
  record: MedicalRecord;
  onView?: (record: MedicalRecord) => void;
  onVerify?: (record: MedicalRecord) => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-soft transition-colors hover:border-ink-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-800">{record.title}</p>
            <p className="mt-0.5 text-xs text-ink-400">{RECORD_CATEGORY_LABELS[record.category]}</p>
          </div>
        </div>
        <IntegrityBadge status={record.verificationStatus} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-400">
        <span>Uploaded {formatDate(record.createdAt)}</span>
        <span>{formatBytes(record.fileSize)}</span>
        <span className="font-mono text-xs text-ink-500">{shortHash(record.sha256Hash)}</span>
      </div>
      {(onView || onVerify) && (
        <div className="mt-3 flex gap-2">
          {onView && (
            <Button size="sm" variant="outline" onClick={() => onView(record)}>
              <Eye className="h-3.5 w-3.5" /> View
            </Button>
          )}
          {onVerify && (
            <Button size="sm" variant="ghost" onClick={() => onVerify(record)}>
              Verify
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function IntegrityBadge({ status }: { status: MedicalRecord['verificationStatus'] }) {
  if (status === 'verified') {
    return (
      <Badge variant="success">
        <ShieldCheck className="h-3 w-3" /> Integrity verified
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge variant="danger">
        <ShieldAlert className="h-3 w-3" /> Integrity check failed
      </Badge>
    );
  }
  return (
    <Badge variant="warning">
      <Loader2 className="h-3 w-3" /> Integrity pending
    </Badge>
  );
}

export function NoAccessNotice({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-5 text-sm text-ink-400">
      <Lock className="h-4 w-4 shrink-0" />
      <span>
        <span className="font-medium text-ink-500">{label}</span> — not included in current consent.
      </span>
    </div>
  );
}

export function useRecordFile(record: MedicalRecord | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    if (!record) {
      setObjectUrl(null);
      return;
    }
    setLoading(true);
    setError('');
    recordsAPI
      .getFileBlob(record._id)
      .then((res) => {
        if (cancelled) return;
        url = URL.createObjectURL(res.data);
        setObjectUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not open this document.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [record]);

  return { objectUrl, loading, error };
}

export function RecordViewerModal({
  record,
  onClose
}: {
  record: MedicalRecord | null;
  onClose: () => void;
}) {
  const { objectUrl, loading, error } = useRecordFile(record);
  const isPdf = record?.mimeType === 'application/pdf';

  return (
    <Modal
      open={Boolean(record)}
      onClose={onClose}
      title={record?.title}
      description={
        record
          ? `${RECORD_CATEGORY_LABELS[record.category]} · ${formatBytes(record.fileSize)} · uploaded ${formatDate(record.createdAt)}`
          : undefined
      }
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-[11px] text-ink-400">
            Access is authorization-checked on every view. Downloading is not required to preview.
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {loading && (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      )}
      {error && !loading && (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <Lock className="h-6 w-6 text-red-600/70" />
          <p className="text-sm text-ink-600">{error}</p>
        </div>
      )}
      {objectUrl && !loading && (
        <div className={cn('overflow-hidden rounded-lg border border-ink-200 bg-ink-50', isPdf ? 'h-[70vh]' : 'flex items-center justify-center p-4')}>
          {isPdf ? (
            <iframe title="Document preview" src={objectUrl} className="h-full w-full" />
          ) : (
            <img src={objectUrl} alt={record?.title || 'Medical document'} className="max-h-[70vh] max-w-full rounded object-contain" />
          )}
        </div>
      )}
    </Modal>
  );
}

export function VerifyModal({
  record,
  onClose
}: {
  record: MedicalRecord | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!record) return;
    setLoading(true);
    setError('');
    setResult(null);
    blockchainAPI
      .verifyRecord(record._id)
      .then((res) => setResult(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not run the integrity check.')))
      .finally(() => setLoading(false));
  }, [record]);

  const matches = result?.matches;

  return (
    <Modal
      open={Boolean(record)}
      onClose={onClose}
      title="Document Integrity Verification"
      description="Compares the current file hash against the hash recorded at upload time."
      size="md"
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-sm text-ink-500">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Verifying document integrity…
        </div>
      )}
      {error && !loading && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>}
      {result && !loading && (
        <div className="space-y-4">
          <div
            className={
              'flex items-center gap-3 rounded-xl border px-4 py-3.5 ' +
              (matches ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')
            }
          >
            {matches ? (
              <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-700" />
            ) : (
              <ShieldAlert className="h-6 w-6 shrink-0 text-red-600" />
            )}
            <div>
              <p className={cn('text-sm font-semibold', matches ? 'text-emerald-700' : 'text-red-600')}>
                {matches ? 'Document integrity verified' : 'Integrity check failed'}
              </p>
              <p className="text-xs text-ink-500">
                {matches
                  ? 'The stored file matches the hash recorded at upload.'
                  : 'The current file does not match the recorded hash. The file may have been altered or corrupted.'}
              </p>
            </div>
          </div>

          <dl className="space-y-3 rounded-xl border border-ink-200 bg-ink-50 p-4">
            <div>
              <dt className="stat-label">Document</dt>
              <dd className="mt-0.5 text-sm text-ink-700">{result.title}</dd>
            </div>
            <div>
              <dt className="stat-label">Uploaded</dt>
              <dd className="mt-0.5 text-sm text-ink-700">{formatDateTime(result.uploadedAt)}</dd>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="stat-label">Current SHA-256</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-ink-500">{result.currentHash}</dd>
              </div>
              <div>
                <dt className="stat-label">Stored SHA-256</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-ink-500">{result.storedHash}</dd>
              </div>
            </div>
            {result.transaction && (
              <>
                <div className="border-t border-ink-200 pt-3">
                  <dt className="stat-label">Audit record ID</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs text-ink-500">{result.transaction.txId}</dd>
                  <dd className="mt-1 text-[11px] text-ink-400">
                    Anchored {formatDateTime(result.transaction.timestamp)} · status {result.transaction.status}
                  </dd>
                </div>
              </>
            )}
            {!result.transaction && (
              <div className="border-t border-ink-200 pt-3">
                <dt className="stat-label">Audit record</dt>
                <dd className="mt-0.5 text-xs text-ink-400">No ledger entry recorded for this document.</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </Modal>
  );
}