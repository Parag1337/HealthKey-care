import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode.react';
import { doctorAPI, getErrorMessage } from '../../lib/api';
import { QrCodeInfo } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../lib/format';

async function copyText(text: string): Promise<boolean> {
  const legacyCopy = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return legacyCopy();
    }
  }
  return legacyCopy();
}

export const MyQrPage = () => {
  const { user } = useAuth();
  const [qr, setQr] = useState<QrCodeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const { success, error: toastError } = useToast();

  const clearCopyTimer = () => {
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
      copyTimer.current = null;
    }
  };

  useEffect(() => clearCopyTimer, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorAPI.getMyQr();
      setQr(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = async () => {
    if (!qr) return;
    const ok = await copyText(qr.payload);
    if (!ok) {
      toastError("Couldn't copy the link. Please copy it manually.");
      return;
    }
    setCopied(true);
    success('Doctor access link copied to clipboard.');
    clearCopyTimer();
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    try {
      clearCopyTimer();
      setCopied(false);
      const res = await doctorAPI.regenerateQr();
      setQr(res.data);
      success('QR code regenerated. The previous code no longer works.');
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  if (loading) return <SkeletonList rows={2} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="page-title">My HealthKey QR</h1>
        <p className="page-subtitle">Show this QR to a patient to securely request access to their health information.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="rounded-2xl border border-ink-200 bg-white p-4">
            {qr && (
              <QRCode
                value={qr.payload}
                size={220}
                level="M"
                fgColor="#18181b"
                bgColor="#ffffff"
                aria-label="Doctor QR code"
              />
            )}
          </div>
          <Button onClick={handleCopy} className="w-full max-w-xs" disabled={!qr}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link Copied' : 'Copy QR Link'}
          </Button>
          <div className="w-full space-y-1.5 text-center">
            <p className="text-base font-semibold text-ink-800">{user?.name}</p>
            <p className="text-xs text-ink-500">
              {user?.specialization || 'Doctor'}
              {user?.hospital ? ` · ${user.hospital}` : ''}
            </p>
            <p className="text-xs text-ink-500">
              HealthKey Doctor ID: <span className="font-mono text-ink-500">HK-DOC-{String(user?.id || '').slice(-5).padStart(5, '0')}</span>
            </p>
            {qr && <p className="text-[11px] text-ink-400">Valid until {formatDateTime(qr.expiresAt)}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={() => setConfirmRegen(true)}>
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate QR
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">How it works</p>
          <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-ink-500">
            <li>The QR code identifies you as a doctor — it contains no patient information.</li>
            <li>Patients scan it, choose what to share, and send you an access request.</li>
            <li>Access is time-limited and can be revoked by the patient at any time.</li>
            <li>Regenerating the QR invalidates the previous code immediately.</li>
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmRegen}
        onClose={() => setConfirmRegen(false)}
        onConfirm={handleRegenerate}
        title="Regenerate QR code?"
        message="Your current QR code will stop working immediately. Patients who scanned it will need the new code."
        confirmLabel="Regenerate"
      />
    </div>
  );
};