import type { Booking, Turf } from './types';

// Real numbers for the home page strip. A stat is left out while its count is 0, so the site never shows made-up or empty numbers.
const MADE: ReadonlySet<Booking['status']> = new Set(['confirmed', 'checked_in', 'no_show']);

export type HomeStat = { key: 'turfs' | 'areas' | 'bookings'; icon: string; value: number; label: string };

export function homeStats(turfs: Pick<Turf, 'status' | 'area'>[], bookings: Pick<Booking, 'status'>[]): HomeStat[] {
  const listed = turfs.filter((t) => t.status === 'active');
  const areas = new Set(listed.map((t) => t.area.trim().toLowerCase()).filter(Boolean)).size;
  const made = bookings.filter((b) => MADE.has(b.status)).length;
  const stats: HomeStat[] = [
    { key: 'turfs', icon: '🏟️', value: listed.length, label: listed.length === 1 ? 'turf listed' : 'turfs listed' },
    { key: 'areas', icon: '📍', value: areas, label: areas === 1 ? 'area' : 'areas' },
    { key: 'bookings', icon: '⭐', value: made, label: made === 1 ? 'booking made' : 'bookings made' },
  ];
  return stats.filter((s) => s.value > 0);
}
