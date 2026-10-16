'use client';

import NavIcon from '@/components/dash/NavIcon';
import { useActionState, useEffect, useRef, useState } from 'react';
import { dash } from '@/components/dash/ui';
import { checkInBooking } from '@/lib/partner-actions';
import type { ActionResult } from '@/lib/types';

// BarcodeDetector is available in Chrome/Edge/Android; other browsers fall back to typing the code
interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike { detect(source: HTMLVideoElement): Promise<DetectedBarcode[]> }
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
  }
}

export default function CheckInDesk({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [state, formAction, pending] = useActionState(async (prev: ActionResult, fd: FormData) => {
    const res = await checkInBooking(prev, fd);
    if (res?.ok) setCode(''); // ready for the next player
    return res;
  }, null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (!scanning) return;
    let raf = 0;
    let stopped = false;
    const Detector = window.BarcodeDetector;
    if (!Detector) return;
    const detector = new Detector({ formats: ['qr_code'] });

    const tick = async () => {
      if (stopped || !videoRef.current) return;
      try {
        const found = await detector.detect(videoRef.current);
        const value = found[0]?.rawValue?.trim();
        if (value) {
          setCode(value);
          stopCamera();
          // Let React apply the value before submitting
          requestAnimationFrame(() => formRef.current?.requestSubmit());
          return;
        }
      } catch {
        // frame not ready yet
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [scanning]);

  const startCamera = async () => {
    setScanError('');
    if (!window.BarcodeDetector) {
      setScanError('QR scanning needs Chrome or Edge. You can type the code instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setScanError('Could not open the camera. Allow camera access or type the code.');
    }
  };

  return (
    <div className={dash.form}>
      <form ref={formRef} action={formAction} className={dash.inline} style={{ width: '100%' }}>
        <input
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Booking code, e.g. SA-7KQ2MX"
          className={dash.input}
          style={{ flex: 1, minWidth: 200, fontSize: 18, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.05em' }}
          autoFocus
          required
        />
        <button type="submit" className={dash.btn} disabled={pending}>{pending ? 'Checking…' : 'Check in'}</button>
        {scanning ? (
          <button type="button" className={`${dash.btn} ${dash.btnSecondary}`} onClick={stopCamera}>Stop camera</button>
        ) : (
          <button type="button" className={`${dash.btn} ${dash.btnSecondary}`} onClick={startCamera}><NavIcon name="camera" size={16} /> Scan QR</button>
        )}
      </form>

      {scanning && (
        <video ref={videoRef} muted playsInline style={{ width: '100%', maxWidth: 420, borderRadius: 12, background: '#000' }} />
      )}
      {scanError && <p className={`${dash.message} ${dash.error}`}>{scanError}</p>}
      {state?.data?.due && (
        // The player owes a balance: the desk confirms it took the cash before the check-in goes through
        <form action={formAction} className={dash.inline}>
          <input type="hidden" name="code" value={state.data.code} />
          <input type="hidden" name="cashCollected" value="true" />
          <button type="submit" className={dash.btn} disabled={pending}>Cash collected: ₹{state.data.due} — check in</button>
        </form>
      )}
      {state?.error && <p role="alert" className={`${dash.message} ${dash.error}`}>{state.error}</p>}
      {state?.ok && <p role="status" className={`${dash.message} ${dash.success}`} style={{ fontSize: 16, fontWeight: 600 }}>{state.ok}</p>}
    </div>
  );
}
