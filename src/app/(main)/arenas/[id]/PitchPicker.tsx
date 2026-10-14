import { hourlyRate } from '@/lib/pricing';
import type { PitchSize, PublicTurf } from '@/lib/types';
import { rupees } from '@/lib/format';
import { mapTurfToVenue, type MappedBookable } from '@/lib/data-mapping';
import styles from './BookingFlow.module.css';

interface PitchPickerProps {
  turf: PublicTurf;
  size: PitchSize;
  onChange: (size: PitchSize) => void;
  selectedBookableId?: string;
  onBookableChange?: (bookable: MappedBookable) => void;
}

/** Full or half pitch, or court selection for multi-court venues. */
export default function PitchPicker({
  turf,
  size,
  onChange,
  selectedBookableId,
  onBookableChange,
}: PitchPickerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = mapTurfToVenue(turf as any);

  // If the turf has multiple bookables (e.g. Badminton courts, Pickleball courts) and is not halfPitch
  if (!turf.halfPitch && mapped.bookables.length > 1) {
    return (
      <>
        <div className={styles.stepHead}>
          <h3>Choose court</h3>
          <span className={styles.muted}>{mapped.bookables.length} available</span>
        </div>
        <div className={styles.pitchPick} role="radiogroup" aria-label="Court">
          {mapped.bookables.map((bookable) => {
            const isSelected = selectedBookableId
              ? selectedBookableId === bookable.id
              : bookable.id === mapped.bookables[0].id;
            return (
              <button
                key={bookable.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.pitchOption} ${isSelected ? styles.pitchOptionOn : ''}`}
                onClick={() => onBookableChange?.(bookable)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>
                    {bookable.sport === 'badminton' ? '🏸' : bookable.sport === 'pickleball' ? '🏓' : '⚽'}
                  </span>
                  <b>{bookable.name}</b>
                </div>
                <small>
                  {bookable.slotMinutes} min slots · from {rupees(bookable.basePrice)}/slot
                </small>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (!turf.halfPitch) {
    return null;
  }

  return (
    <>
      <div className={styles.stepHead}>
        <h3>Choose pitch</h3>
      </div>
      <div className={styles.pitchPick} role="radiogroup" aria-label="Pitch">
        {(['full', 'half'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={size === option}
            className={`${styles.pitchOption} ${size === option ? styles.pitchOptionOn : ''}`}
            onClick={() => onChange(option)}
          >
            <svg viewBox="0 0 60 38" width="60" height="38" aria-hidden className={styles.pitchArt}>
              <rect x="1" y="1" width="58" height="36" rx="3" className={styles.pitchGrass} />
              {option === 'half' && <rect x="30" y="1" width="29" height="36" rx="0" className={styles.pitchOff} />}
              <rect x="1" y="1" width="58" height="36" rx="3" className={styles.pitchLines} />
              <line x1="30" y1="1" x2="30" y2="37" className={styles.pitchLines} />
              <circle cx="30" cy="19" r="6" className={styles.pitchLines} />
              <rect x="1" y="11" width="7" height="16" className={styles.pitchLines} />
              <rect x="52" y="11" width="7" height="16" className={styles.pitchLines} />
            </svg>
            <b>{option === 'full' ? 'Full pitch' : 'Half pitch'}</b>
            <small>
              {option === 'full' ? turf.size : 'Smaller games'} · from {rupees(hourlyRate(turf, option))}/hr
            </small>
          </button>
        ))}
      </div>
    </>
  );
}
