import { hourlyRate } from '@/modules/shared/lib/pricing';
import type { Bookable, PitchSize, PublicTurf } from '@/modules/shared/database/types';
import { rupees } from '@/modules/shared/lib/format';
import { isHalfBookable, mapTurfToResourcesAndBookables } from '@/modules/shared/lib/venue-mapping';
import styles from './BookingFlow.module.css';

interface PitchPickerProps {
  turf: PublicTurf;
  size: PitchSize;
  onChange: (size: PitchSize) => void;
  selectedBookableId?: string;
  /** Fires with the chosen court; on a split pitch its Right or Left half decides the side */
  onBookableChange?: (bookable: Bookable) => void;
}

/** Full/half pitch picker or multi-court bookable offerings picker (R007). */
export default function PitchPicker({
  turf,
  size,
  onChange,
  selectedBookableId,
  onBookableChange,
}: PitchPickerProps) {
  const { bookables } = mapTurfToResourcesAndBookables(turf);
  const isMultiOffering = bookables && bookables.length > 2;

  if (isMultiOffering) {
    return (
      <>
        <div className={styles.stepHead}>
          <h3>Choose court or offering</h3>
        </div>
        <div className={styles.pitchPick} role="radiogroup" aria-label="Court or Offering">
          {bookables.map((b) => {
            const isSelected = selectedBookableId
              ? selectedBookableId === b.id
              : isHalfBookable(turf, b)
                ? size === 'half'
                : size === 'full';
            const sportIcon =
              b.sport === 'football'
                ? '⚽'
                : b.sport === 'box_cricket'
                  ? '🏏'
                  : b.sport === 'badminton'
                    ? '🏸'
                    : b.sport === 'pickleball'
                      ? '🏓'
                      : '🏟️';
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.pitchOption} ${isSelected ? styles.pitchOptionOn : ''}`}
                onClick={() => {
                  onBookableChange?.(b);
                }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: 2 }}>{sportIcon}</div>
                <b>{b.name}</b>
                <small>
                  {b.slotMinutes} mins · {rupees(b.basePrice)}
                </small>
              </button>
            );
          })}
        </div>
      </>
    );
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
            onClick={() => {
              onChange(option);
              const matching = bookables.find((b) =>
                option === 'half' ? isHalfBookable(turf, b) : !isHalfBookable(turf, b)
              );
              if (matching) onBookableChange?.(matching);
            }}
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
