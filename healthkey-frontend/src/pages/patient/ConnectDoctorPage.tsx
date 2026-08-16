import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, CameraOff, Link2, Loader2, QrCode, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';

type ScanState =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'active' }
  | { kind: 'processing'; token: string }
  | { kind: 'error'; message: string };

function extractToken(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(/^\/connect\/doctor\/([A-Za-z0-9_-]+)$/);
      if (match) return match[1];
      return null;
    } catch {
      return null;
    }
  }
  if (/^[A-Za-z0-9_-]{10,256}$/.test(trimmed)) return trimmed;
  return null;
}

export const ConnectDoctorPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ScanState>({ kind: 'idle' });
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleToken = useCallback(
    (token: string) => {
      navigate(`/connect/doctor/${token}`);
    },
    [navigate]
  );

  const startCamera = useCallback(async () => {
    setManualOpen(false);
    setState({ kind: 'starting' });

    if (!navigator.mediaDevices?.getUserMedia) {
      setState({
        kind: 'error',
        message: 'Camera scanning is not supported in this browser. You can enter the QR link manually instead.'
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (!videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      await videoRef.current.play();
      setState({ kind: 'active' });

      const tick = () => {
        const video = videoRef.current;
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.floor(video.videoWidth * scale);
        canvas.height = Math.floor(video.videoHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
          if (code) {
            const token = extractToken(code.data);
            if (token) {
              stopCamera();
              handleToken(token);
              return;
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = err instanceof Error ? err.name : undefined;
      let message = 'Could not start the camera. Please allow camera access and try again.';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. You can still enter the QR link manually below.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        message = 'No camera was found on this device. Use the manual link option instead.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        message = 'The camera is in use by another application. Close it and try again.';
      }
      setState({ kind: 'error', message });
    }
  }, [handleToken, stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = extractToken(manualText);
    if (!token) {
      setState({
        kind: 'error',
        message: 'That does not look like a valid HealthKey QR link. Ask the doctor to refresh their QR code.'
      });
      return;
    }
    setState({ kind: 'processing', token });
    handleToken(token);
  };

  const prefill = searchParams.get('q');

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="page-title">Connect to Doctor</h1>
        <p className="page-subtitle">Scan the doctor&apos;s HealthKey QR code to securely request access.</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {state.kind === 'idle' || state.kind === 'starting' ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
                {state.kind === 'starting' ? (
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                ) : (
                  <QrCode className="h-7 w-7 text-ink-500" />
                )}
              </div>
              {state.kind === 'starting' ? (
                <p className="text-sm text-ink-500">Starting camera…</p>
              ) : (
                <>
                  <p className="text-sm text-ink-600">Point your camera at the doctor&apos;s HealthKey QR code.</p>
                  <p className="max-w-sm text-xs text-ink-400">
                    The QR only identifies the doctor — no medical information is ever shared until you explicitly approve it.
                  </p>
                </>
              )}
              <Button onClick={startCamera} disabled={state.kind === 'starting'}>
                <Camera className="h-4 w-4" /> Scan QR Code
              </Button>
              <button
                onClick={() => {
                  setManualOpen(true);
                  setState({ kind: 'idle' });
                }}
                className="text-xs font-medium text-ink-400 underline-offset-2 hover:text-ink-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-400 rounded"
              >
                Enter link manually
              </button>
            </div>
          ) : null}

          {state.kind === 'active' && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative mx-auto h-56 w-56">
                    <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-emerald-500" />
                    <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-emerald-500" />
                    <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-emerald-500" />
                    <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-emerald-500" />
                    <ScanLine className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse text-emerald-600/80" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-ink-400">Point your camera at the doctor&apos;s QR code.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopCamera();
                    setState({ kind: 'idle' });
                  }}
                >
                  Stop
                </Button>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setManualOpen(true);
                }}
                className="mx-auto block text-xs font-medium text-ink-400 underline-offset-2 hover:text-ink-600 hover:underline"
              >
                Enter link manually
              </button>
            </div>
          )}

          {state.kind === 'error' && !manualOpen && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CameraOff className="h-8 w-8 text-red-600/70" />
              <p className="max-w-sm text-sm text-ink-600">{state.message}</p>
              <Button variant="outline" size="sm" onClick={startCamera}>
                Try again
              </Button>
              <button
                onClick={() => setManualOpen(true)}
                className="text-xs font-medium text-ink-400 underline-offset-2 hover:text-ink-600 hover:underline"
              >
                Enter the QR link manually
              </button>
            </div>
          )}

          {manualOpen && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <Field
                label="HealthKey QR link"
                hint="Paste the full link you received from the doctor, or the code itself."
              >
                <Input
                  autoFocus
                  value={manualText}
                  placeholder="https://…/connect/doctor/…"
                  defaultValue={prefill || undefined}
                  onChange={(e) => setManualText(e.target.value)}
                />
              </Field>
              {state.kind === 'error' && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                  {state.message}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="submit" loading={state.kind === 'processing'}>
                  <Link2 className="h-4 w-4" /> Continue
                </Button>
                <Button type="button" variant="ghost" onClick={() => setManualOpen(false)}>
                  Back
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};