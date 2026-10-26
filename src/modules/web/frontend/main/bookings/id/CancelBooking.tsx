'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelMyBooking } from '@/modules/web/backend/booking-actions';
import { DEVICE_EVENT } from '@/modules/web/frontend/hooks/device';

// Lets the player cancel their own upcoming booking (shown only while cancellation is still allowed)
export default function CancelBooking({ bookingId, cutoffHours, needsPhone }: { bookingId: string; cutoffHours: number; needsPhone: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <div style={{ marginTop: 12, textAlign: 'center' }}>
      {needsPhone && (
        <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
          Mobile number used for this booking
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            style={{ display: 'block', margin: '4px auto 0', textAlign: 'center' }}
          />
        </label>
      )}
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        style={{ color: 'var(--err)' }}
        disabled={pending}
        onClick={() => {
          if (!window.confirm('Cancel this booking? The slot will be released for others.')) return;
          setError('');
          start(async () => {
            const result = await cancelMyBooking(bookingId, phone);
            if ('error' in result) setError(result.error);
            else {
              window.dispatchEvent(new Event(DEVICE_EVENT)); // update the upcoming count in the top bar
              router.refresh();
            }
          });
        }}
      >
        {pending ? 'Cancelling…' : 'Cancel booking'}
      </button>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Free cancellation up to {cutoffHours} hours before your slot.</p>
      {error && <p role="alert" style={{ color: 'var(--err)', fontSize: 13, marginTop: 4 }}>{error}</p>}
    </div>
  );
}
