'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelMyBooking } from '@/lib/booking-actions';
import { DEVICE_EVENT } from '@/lib/client/device';

// Lets the player cancel their own upcoming booking (shown only while cancellation is still allowed)
export default function CancelBooking({ bookingId, cutoffHours }: { bookingId: string; cutoffHours: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  return (
    <div style={{ marginTop: 12, textAlign: 'center' }}>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        style={{ color: '#b00020' }}
        disabled={pending}
        onClick={() => {
          if (!window.confirm('Cancel this booking? The slot will be released for others.')) return;
          setError('');
          start(async () => {
            const result = await cancelMyBooking(bookingId);
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
      {error && <p role="alert" style={{ color: '#b00020', fontSize: 13, marginTop: 4 }}>{error}</p>}
    </div>
  );
}
