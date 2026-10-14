// Opening hours are whole hours, and a turf closes either later the same day, at midnight (00:00),
// or in the late night / early morning (e.g. 01:00 to 06:00).
export function hoursError(openTime: string, closeTime: string): string | null {
  if (!openTime.endsWith(':00') || !closeTime.endsWith(':00')) {
    return 'Use whole hours for opening and closing times, for example 06:00 and 23:00';
  }
  const open = Number.parseInt(openTime, 10);
  const close = Number.parseInt(closeTime, 10);
  if (close === open) return 'Closing time must be different from opening time';
  if (close === 0) return null; // Midnight close
  if (close < open) {
    if (close <= 6) return null; // Late night / early morning close (e.g. 01:00 to 06:00)
    return 'Closing time must be after opening time, or up to 06:00 for late night slots';
  }
  return null;
}
