import type { Bookable, PitchSize, PublicTurf } from '@/modules/shared/database/types';
import { isHalfBookable, mapTurfToResourcesAndBookables } from '@/modules/shared/lib/venue-mapping';
import styles from '@/modules/web/frontend/main/arenas/id/BookingFlow.module.css';

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
        <div className={styles.pitchArea}><div className={styles.pitchPick} role="radiogroup" aria-label="Court or Offering">
          {bookables.map((b) => {
            const isSelected = selectedBookableId
              ? selectedBookableId === b.id
              : isHalfBookable(turf, b)
                ? size === 'half'
                : size === 'full';
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
                <b>{b.name}</b>
                <small>
                  {b.slotMinutes} mins
                </small>
              </button>
            );
          })}
        </div></div>
      </>
    );
  }

  return (
    <>
      <div className={styles.stepHead}>
        <h3>Choose pitch</h3>
      </div>
      <div className={styles.pitchArea}><div className={styles.pitchPick} role="radiogroup" aria-label="Pitch">
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
            <b>{option === 'full' ? 'Full pitch' : 'Half pitch'}</b>
          </button>
        ))}
      </div></div>
    </>
  );
}
