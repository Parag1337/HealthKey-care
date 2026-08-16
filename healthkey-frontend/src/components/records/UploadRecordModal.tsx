import { useRef, useState } from 'react';
import { CheckCircle2, FileUp, Loader2, UploadCloud } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { RECORD_CATEGORY_OPTIONS, RecordCategory, MAX_UPLOAD_BYTES } from '../../types';
import { getErrorMessage, recordsAPI, UploadProgress } from '../../lib/api';
import { formatBytes } from '../../lib/format';

const ACCEPT = 'application/pdf,image/png,image/jpeg';

type Phase = 'idle' | 'validating' | 'uploading' | 'saving' | 'success' | 'error';

const STAGES: { key: Phase; label: string }[] = [
  { key: 'validating', label: 'Validating' },
  { key: 'uploading', label: 'Uploading securely' },
  { key: 'saving', label: 'Saving record' }
];

interface UploadRecordModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export const UploadRecordModal = ({ open, onClose, onUploaded }: UploadRecordModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<RecordCategory>('lab_report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  const reset = () => {
    setFile(null);
    setCategory('lab_report');
    setTitle('');
    setDescription('');
    setRecordDate('');
    setProgress(null);
    setPhase('idle');
    setError('');
  };

  const handleClose = () => {
    if (submittingRef.current) return;
    reset();
    onClose();
  };

  const pickFile = (candidate: File | null) => {
    if (submittingRef.current) return;
    setError('');
    setPhase('idle');
    if (!candidate) return;

    const allowed = ACCEPT.split(',').includes(candidate.type);
    const ext = (candidate.name.split('.').pop() || '').toLowerCase();
    const extAllowed = ['pdf', 'png', 'jpg', 'jpeg'].includes(ext);
    if (!allowed || !extAllowed) {
      setError('Unsupported file type. Please upload a PDF, JPG or PNG.');
      return;
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      setError(`This file is larger than the ${formatBytes(MAX_UPLOAD_BYTES)} limit.`);
      return;
    }
    setFile(candidate);
    if (!title.trim()) {
      setTitle(candidate.name.replace(/\.[^.]+$/, '').slice(0, 120));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (submittingRef.current) return;
    if (!file) {
      setError('Choose a file to upload first.');
      return;
    }
    submittingRef.current = true;
    setPhase('validating');
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('category', category);
      if (title.trim()) form.append('title', title.trim());
      if (description.trim()) form.append('description', description.trim());
      if (recordDate) form.append('recordDate', new Date(recordDate).toISOString());
      setPhase('uploading');
      await recordsAPI.upload(form, (p) => setProgress(p));
      setPhase('saving');
      await new Promise((r) => setTimeout(r, 350));
      setPhase('success');
      setTimeout(() => {
        submittingRef.current = false;
        handleClose();
        onUploaded();
      }, 900);
    } catch (err) {
      submittingRef.current = false;
      setPhase('error');
      setError(getErrorMessage(err, "We couldn't upload your document. Please try again."));
    }
  };

  const uploading = phase === 'validating' || phase === 'uploading' || phase === 'saving';
  const currentStageIndex = phase === 'validating' ? 0 : phase === 'uploading' ? 1 : 2;

  const stageRow = (stage: { key: Phase; label: string }, idx: number) => {
    const done = phase === 'success' || (uploading && idx < currentStageIndex);
    const active = uploading && idx === currentStageIndex;
    return (
      <li key={stage.key} className="flex items-center gap-2.5 text-xs">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : active ? (
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
        ) : (
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-ink-200 text-[10px] text-ink-400">{idx + 1}</span>
        )}
        <span className={active || done ? 'font-medium text-ink-700' : 'text-ink-400'}>{stage.label}</span>
        {stage.key === 'uploading' && phase === 'uploading' && progress && (
          <span className="ml-auto font-mono text-[11px] text-ink-500">{progress.percent}%</span>
        )}
      </li>
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload Medical Record"
      description="PDF, JPG or PNG — maximum 10 MB. Files are stored securely and integrity-stamped."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} loading={uploading} disabled={!file || uploading}>
            {phase === 'success' ? 'Uploaded' : 'Upload Record'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose a file to upload"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ' +
            (dragOver
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-ink-200 bg-ink-50 hover:border-ink-300') +
            ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40'
          }
        >
          {file ? (
            <>
              <FileUp className="h-7 w-7 text-emerald-600" />
              <p className="text-sm font-medium text-ink-700">{file.name}</p>
              <p className="text-xs text-ink-400">
                {formatBytes(file.size)} · {file.type} — click to choose a different file
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="h-7 w-7 text-ink-400" />
              <p className="text-sm font-medium text-ink-600">Drag & drop a file here, or browse</p>
              <p className="text-xs text-ink-400">PDF, JPG, PNG · max 10 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] || null)}
          />
        </div>

        {uploading && (
          <div role="status" aria-label="Upload progress" className="space-y-2">
            <ul className="space-y-1.5">{STAGES.map(stageRow)}</ul>
            {phase === 'uploading' && (
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-[width] duration-200"
                  style={{ width: `${progress?.percent ?? 0}%` }}
                />
              </div>
            )}
          </div>
        )}

        {phase === 'success' && (
          <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            Document uploaded and integrity hash recorded.
          </p>
        )}

        {phase === 'error' && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Document type" required>
            <Select value={category} onChange={(e) => setCategory(e.target.value as RecordCategory)}>
              {RECORD_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Record date" hint="Optional">
            <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Document title" hint={`Optional — defaults to "${file ? file.name.replace(/\.[^.]+$/, '') : 'file name'}"`}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. CBC Blood Report" />
        </Field>

        <Field label="Notes" hint="Optional">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes about this document…"
          />
        </Field>

        {error && phase === 'idle' && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
};