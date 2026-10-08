// The sports people can filter turfs by. `value` is what turfs list in `sports` and what /arenas?sport= expects.
// `place` is what one venue of that sport is called in copy ("turf" or "court").
export const SPORTS = [
  { value: 'Football', label: 'Football', icon: '⚽', place: 'turf', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop' },
  { value: 'Box Cricket', label: 'Box Cricket', icon: '🏏', place: 'turf', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&auto=format&fit=crop' },
  { value: 'Badminton', label: 'Badminton', icon: '🏸', place: 'court', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop' },
  { value: 'Pickleball', label: 'Pickleball', icon: '🏓', place: 'court', image: 'https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=600&auto=format&fit=crop' },
  { value: 'Padel', label: 'Padel', icon: '🎾', place: 'court', image: 'https://images.unsplash.com/photo-1612534847738-b3af9bc31f0c?q=80&w=600&auto=format&fit=crop' },
] as const;

export const sportHref = (value: string) => `/arenas?sport=${encodeURIComponent(value)}`;

// Every sport on the site in one phrase, for titles and descriptions: "football, box cricket, badminton, pickleball and padel"
export const SPORTS_PHRASE = (() => {
  const names = SPORTS.map((s) => s.label.toLowerCase());
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
})();

export type SportInfo = { label: string; icon: string; place: 'turf' | 'court' };

// Details for a sport name as stored on a turf (case and spaces ignored). Unknown sports get a neutral icon.
export function sportInfo(name: string): SportInfo {
  const key = name.trim().toLowerCase();
  const known = SPORTS.find((s) => s.value.toLowerCase() === key);
  return known ? { label: known.label, icon: known.icon, place: known.place } : { label: name.trim() || 'Sports', icon: '🏟️', place: 'turf' };
}

// The sport a venue is mainly for: its first listed sport
export function primarySport(turf: { sports: readonly string[] }): SportInfo {
  return sportInfo(turf.sports[0] ?? '');
}
