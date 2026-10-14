'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { rescheduleBooking } from '@/lib/booking-actions';
import { DEVICE_EVENT } from '@/lib/client/device';
import { formatSlotRange } from '@/lib/time';

interface RescheduleBookingProps {
  bookingId: string;
  currentDate: string;
  currentHour: number;
  openHours: number[];
  needsPhone: boolean;
  durationMinutes?: number;
  startMinute?: number;
}

export default function RescheduleBooking({
  bookingId,
  currentDate,
  currentHour,
  openHours,
  needsPhone,
  durationMinutes = 60,
  startMinute = 0,
}: RescheduleBookingProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phone, setPhone] = useState('');

  // Default new date: next day or current date
  const [newDate, setNewDate] = useState(currentDate);
  const [newHour, setNewHour] = useState(currentHour);

  const hours = openHours.length > 0 ? openHours : Array.from({ length: 16 }, (_, i) => i + 6);

  const handleReschedule = () => {
    setError('');
    setSuccess('');
    if (newDate === currentDate && newHour === currentHour) {
      setError('Please select a different date or time slot');
      return;
    }

    start(async () => {
      const result = await rescheduleBooking(bookingId, newDate, newHour, phone);
      if ('error' in result) {
        setError(result.error);
      } else {
        setSuccess('Slot rescheduled successfully!');
        window.dispatchEvent(new Event(DEVICE_EVENT));
        setTimeout(() => {
          setOpen(false);
          router.refresh();
        }, 1200);
      }
    });
  };

  return (
    <div style={{ marginTop: 12, textAlign: 'center' }}>
      {!open ? (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => setOpen(true)}
          style={{ width: '100%', maxWidth: 280, margin: '0 auto' }}
        >
          🔁 Reschedule booking
        </button>
      ) : (
        <div
          style={{
            background: 'var(--bg-card, #f8f9fa)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            maxWidth: 340,
            margin: '0 auto',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Reschedule Slot</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <label style={{ display: 'block', fontSize: 13, marginBottom: 10 }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Select new date</span>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: '#fff',
              }}
            />
          </label>

          <label style={{ display: 'block', fontSize: 13, marginBottom: 10 }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Select new time</span>
            <select
              value={newHour}
              onChange={(e) => setNewHour(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: '#fff',
              }}
            >
              {hours.map((h) => (
                <option key={h} value={h}>
                  {formatSlotRange(h, durationMinutes, startMinute)}
                </option>
              ))}
            </select>
          </label>

          {needsPhone && (
            <label style={{ display: 'block', fontSize: 13, marginBottom: 12 }}>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Mobile number used for booking</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: '#fff',
                }}
              />
            </label>
          )}

          {error && (
            <p role="alert" style={{ color: '#b00020', fontSize: 13, marginBottom: 10 }}>
              {error}
            </p>
          )}
          {success && (
            <p role="status" style={{ color: '#007a3d', fontSize: 13, marginBottom: 10 }}>
              {success}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={pending}
              onClick={handleReschedule}
              style={{ flex: 1 }}
            >
              {pending ? 'Rescheduling…' : 'Confirm'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
