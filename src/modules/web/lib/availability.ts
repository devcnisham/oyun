// Time-of-day choices for the arenas date filter. Hours are slot start hours in IST.
export const TIME_WINDOWS = [
  { value: 'morning', label: 'Morning', hint: '5 AM – 12 PM' },
  { value: 'afternoon', label: 'Afternoon', hint: '12 – 5 PM' },
  { value: 'evening', label: 'Evening', hint: '5 – 9 PM' },
  { value: 'night', label: 'Night', hint: '9 PM – 5 AM' },
] as const;

export type TimeWindow = (typeof TIME_WINDOWS)[number]['value'];

export const isTimeWindow = (v: string | null): v is TimeWindow => TIME_WINDOWS.some((w) => w.value === v);

export function hourInWindow(hour: number, window: TimeWindow): boolean {
  const h = ((hour % 24) + 24) % 24;
  switch (window) {
    case 'morning':
      return h >= 5 && h < 12;
    case 'afternoon':
      return h >= 12 && h < 17;
    case 'evening':
      return h >= 17 && h < 21;
    case 'night':
      return h >= 21 || h < 5;
  }
}

// A turf passes when it has an open slot on the day, inside the chosen part of the day if one is set
export function hasOpenSlot(openHours: number[], window: TimeWindow | ''): boolean {
  return window ? openHours.some((h) => hourInWindow(h, window)) : openHours.length > 0;
}
