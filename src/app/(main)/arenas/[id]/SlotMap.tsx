import type { Slot } from '@/lib/types';
import { rupees, SESSIONS, shortHour, slotTitle, unavailableLabel } from './booking-format';
import styles from './BookingFlow.module.css';

interface SlotMapProps {
  slots: Slot[];
  selected: number[];
  loading: boolean;
  onToggle: (slot: Slot) => void;
}

function seatState(slot: Slot, isSelected: boolean) {
  if (isSelected) return styles.on;
  if (slot.available) return styles.open;
  return slot.reason === 'held' ? styles.held : slot.reason === 'past' ? styles.past : styles.taken;
}

/** Cinema-style seat map: slots grouped by part of the day, plus the colour legend. */
export default function SlotMap({ slots, selected, loading, onToggle }: SlotMapProps) {
  return (
    <>
      <div className={`${styles.map} ${loading ? styles.mapLoading : ''}`}>
        {slots.length === 0 && <p className={styles.muted}>No slots on this day.</p>}
        {SESSIONS.map((session) => {
          const inSession = slots.filter((s) => s.hour >= session.from && s.hour < session.to);
          if (inSession.length === 0) return null;
          return (
            <div key={session.name} className={styles.session}>
              <div className={styles.sessionName}>
                <span>{session.icon}</span> {session.name}
              </div>
              <div className={styles.grid}>
                {inSession.map((slot) => {
                  const isOn = selected.includes(slot.hour);
                  const deal = slot.tags.find((t) => t.includes('-'));
                  return (
                    <button
                      key={slot.hour}
                      className={`${styles.seat} ${seatState(slot, isOn)}`}
                      onClick={() => onToggle(slot)}
                      aria-pressed={isOn}
                      aria-disabled={!slot.available}
                      title={slotTitle(slot)}
                    >
                      {deal && slot.available && <span className={styles.deal}>{deal.match(/-\d+%/)?.[0] ?? 'Deal'}</span>}
                      {slot.tags.includes('Peak') && slot.available && <span className={styles.peak} title="Peak hours" />}
                      <span className={styles.seatTime}>{shortHour(slot.hour)}</span>
                      <span className={styles.seatSub}>
                        {slot.available ? rupees(slot.price) : unavailableLabel(slot, 'On hold', 'Over', 'Booked')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span><i className={styles.open} /> Available</span>
        <span><i className={styles.on} /> Selected</span>
        <span><i className={styles.held} /> On hold</span>
        <span><i className={styles.taken} /> Booked</span>
      </div>
    </>
  );
}
