'use client';

import { useRef, useState } from 'react';
import ActionForm from '@/components/dash/ActionForm';
import { blockSlot, unblockSlot } from '@/lib/partner-actions';
import { formatDate, formatHour } from '@/lib/time';
import type { SlotBlock } from '@/lib/types';
import { dash } from '@/components/dash/ui';
import styles from './PartnerDashboard.module.css';

interface QuickSlotBlockerProps {
  turfHours: number[];
  minDate: string;
  activeBlocks: SlotBlock[];
  canManageSlots: boolean;
}

const PRESET_REASONS = [
  '📞 Phone / Offline Booking',
  '🌧️ Heavy Rain / Weather',
  '🧹 Turf Maintenance',
  '🏆 Private Tournament / Event',
  '⚡ Front Desk Hold',
];

export default function QuickSlotBlocker({
  turfHours,
  minDate,
  activeBlocks,
  canManageSlots,
}: QuickSlotBlockerProps) {
  const reasonInputRef = useRef<HTMLInputElement>(null);
  const [selectedReason, setSelectedReason] = useState('');

  if (!canManageSlots) return null;

  const handleChipClick = (preset: string) => {
    setSelectedReason(preset);
    if (reasonInputRef.current) {
      reasonInputRef.current.value = preset;
      reasonInputRef.current.focus();
    }
  };

  return (
    <div className={styles.blockerSection}>
      <div className={styles.presetChipsGroup}>
        <span className={styles.presetChipsLabel}>Quick reason presets:</span>
        <div className={styles.chipsWrapper}>
          {PRESET_REASONS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={styles.chipBtn}
              onClick={() => handleChipClick(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <ActionForm
        action={blockSlot}
        className={dash.form}
        resetOnSuccess
      >
        <div className={dash.formGrid}>
          <label className={dash.field}>
            <span className={dash.label}>Date</span>
            <input
              type="date"
              name="date"
              min={minDate}
              defaultValue={minDate}
              className={dash.input}
              required
            />
          </label>

          <label className={dash.field}>
            <span className={dash.label}>Time slot</span>
            <select name="hour" className={dash.select} required>
              {turfHours.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>

          <label className={dash.field} style={{ gridColumn: 'span 2' }}>
            <span className={dash.label}>Reason / Note</span>
            <input
              ref={reasonInputRef}
              type="text"
              name="reason"
              defaultValue={selectedReason}
              placeholder="e.g. Phone booking / Maintenance / Rain"
              className={dash.input}
              required
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="submit" className={styles.actionBtnPrimary} style={{ cursor: 'pointer' }}>
            🔒 Block Slot Now
          </button>
        </div>
      </ActionForm>

      {activeBlocks.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
          <span className={styles.presetChipsLabel}>
            Active blocked slots ({activeBlocks.length}):
          </span>
          <div className={styles.activeBlocksList}>
            {activeBlocks.map((bl) => (
              <div key={bl.id} className={styles.activeBlockCard}>
                <span>
                  <strong>{formatDate(bl.date, { month: 'short', day: 'numeric' })}</strong>{' '}
                  {formatHour(bl.hour)} — {bl.reason}
                </span>
                <ActionForm action={unblockSlot} inline confirm="Reopen this slot for bookings?">
                  <input type="hidden" name="blockId" value={bl.id} />
                  <button
                    type="submit"
                    className={styles.unblockBtn}
                    title="Reopen slot"
                    aria-label={`Unblock ${formatHour(bl.hour)} on ${bl.date}`}
                  >
                    ✕
                  </button>
                </ActionForm>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
