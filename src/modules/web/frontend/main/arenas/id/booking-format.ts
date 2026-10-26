import { rupees, shortHour } from '@/modules/shared/lib/format';
import type { Slot } from '@/modules/shared/database/types';

/** Day parts the slot map is grouped into; `to` is exclusive. */
export const SESSIONS = [
  { name: 'Morning', icon: '🌅', from: 6, to: 12 },
  { name: 'Afternoon', icon: '☀️', from: 12, to: 17 },
  { name: 'Evening', icon: '🌆', from: 17, to: 21 },
  { name: 'Night', icon: '🌙', from: 21, to: 24 },
  { name: 'Late Night', icon: '🌃', from: 0, to: 6 },
] as const;

/** "7 PM – 9 PM" for consecutive hours, "7 PM, 9 PM" otherwise. Supports cross-midnight sequences. */
export function describeHours(hours: number[], openHour: number = 0) {
  if (hours.length === 0) return '';
  const norm = (h: number) => (openHour > 0 && h < openHour ? h + 24 : h);
  const sorted = [...hours].sort((a, b) => norm(a) - norm(b));
  const consecutive = sorted.every((h, i) => i === 0 || norm(h) === norm(sorted[i - 1]) + 1);
  if (consecutive) {
    const start = sorted[0];
    const end = sorted[sorted.length - 1] + 1;
    return `${shortHour(start)} – ${shortHour(end % 24)}`;
  }
  return sorted.map((h) => shortHour(h)).join(', ');
}

/** Why a slot cannot be picked: the tooltip, the seat sub-label and the seat colour, per reason. */
const UNAVAILABLE = {
  held: { title: 'Someone is booking this slot', sub: 'On hold', kind: 'held' },
  past: { title: 'Over', sub: 'Over', kind: 'past' },
  other: { title: 'Not available', sub: 'Booked', kind: 'taken' },
} as const;

export function unavailableInfo(slot: Slot) {
  return slot.reason === 'held' ? UNAVAILABLE.held : slot.reason === 'past' ? UNAVAILABLE.past : UNAVAILABLE.other;
}

export function slotTitle(slot: Slot) {
  if (slot.available) return `${slot.label} · ${rupees(slot.price)}`;
  return `${slot.label} · ${unavailableInfo(slot).title}`;
}
