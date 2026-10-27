'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitReview } from '@/modules/web/backend/booking-actions';
import styles from '@/modules/web/frontend/main/bookings/id/ReviewForm.module.css';

const LABELS = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent'];

// Shown on the ticket after the player has played: rate the turf, optionally say why
export default function ReviewForm({ bookingId, turfName, existing, needsPhone }: { bookingId: string; turfName: string; needsPhone: boolean; existing: { rating: number; comment: string } | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [editing, setEditing] = useState(!existing);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [phone, setPhone] = useState('');
  const [pending, start] = useTransition();

  if (!editing) {
    return (
      <section className={styles.box}>
        <h2>Your review</h2>
        <p className={styles.stars} aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}<span>{'★'.repeat(5 - rating)}</span></p>
        {comment && <p className={styles.comment}>“{comment}”</p>}
        {done && <p className={styles.thanks}>Thanks! Your review helps other players.</p>}
        <button type="button" className={styles.link} onClick={() => setEditing(true)}>Edit review</button>
      </section>
    );
  }

  const shown = hover || rating;
  return (
    <section className={styles.box}>
      <h2>How was {turfName}?</h2>
      <div className={styles.picker} role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            className={n <= shown ? styles.on : ''}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
        <span className={styles.label}>{LABELS[shown]}</span>
      </div>
      <textarea
        className={styles.input}
        placeholder="Tell other players about the venue, lights, staff… (optional)"
        maxLength={500}
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {needsPhone && (
        <input
          className={styles.input}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="Mobile number used for this booking"
          aria-label="Mobile number used for this booking"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
        />
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button
        type="button"
        className={styles.submit}
        disabled={rating === 0 || pending}
        onClick={() => {
          setError('');
          start(async () => {
            const result = await submitReview(bookingId, rating, comment, phone);
            if ('error' in result) return setError(result.error);
            setDone(true);
            setEditing(false);
            router.refresh();
          });
        }}
      >
        {pending ? 'Saving…' : existing ? 'Update review' : 'Submit review'}
      </button>
    </section>
  );
}
