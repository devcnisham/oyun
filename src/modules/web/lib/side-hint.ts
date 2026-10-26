import type { Slot } from '@/modules/shared/database/types';

/** Hours the chosen half is taken but the other half is free, so the player can be offered the other side. */
export function swapHours(chosen: Slot[], other: Slot[]): number[] {
  const free = new Set(other.filter((s) => s.available).map((s) => s.hour));
  return chosen.filter((s) => !s.available && (s.reason === 'booked' || s.reason === 'held') && free.has(s.hour)).map((s) => s.hour);
}
