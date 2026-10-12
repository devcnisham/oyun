import type { Slot } from '@/lib/types';

/** Most slots a player can hold in one booking. */
export const MAX_SLOTS = 6;

/** Day parts the slot map is grouped into; `to` is exclusive. */
export const SESSIONS = [
  { name: 'Morning', icon: '🌅', from: 0, to: 12 },
  { name: 'Afternoon', icon: '☀️', from: 12, to: 17 },
  { name: 'Evening', icon: '🌆', from: 17, to: 21 },
  { name: 'Night', icon: '🌙', from: 21, to: 24 },
] as const;

export const rupees = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN')}`;

export const shortHour = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;

/** "7 PM – 9 PM" for consecutive hours, "7 PM, 9 PM" otherwise. */
export function describeHours(hours: number[]) {
  if (hours.length === 0) return '';
  const sorted = [...hours].sort((a, b) => a - b);
  const consecutive = sorted.every((h, i) => i === 0 || h === sorted[i - 1] + 1);
  if (consecutive) return `${shortHour(sorted[0])} – ${shortHour(sorted[sorted.length - 1] + 1)}`;
  return sorted.map(shortHour).join(', ');
}

/** Why a slot cannot be picked, in the words shown to the player. */
export function unavailableLabel(slot: Slot, held: string, over: string, other: string) {
  return slot.reason === 'held' ? held : slot.reason === 'past' ? over : other;
}

export function slotTitle(slot: Slot) {
  if (slot.available) return `${slot.label} · ${rupees(slot.price)}`;
  return `${slot.label} · ${unavailableLabel(slot, 'Someone is booking this slot', 'Over', 'Not available')}`;
}
