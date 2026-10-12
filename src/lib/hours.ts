// Opening hours are whole hours, and a turf closes either later the same day or at midnight (00:00).
// A close time after midnight (for example 02:00) is not supported yet: turfHours() stops at 24:00,
// so it would silently drop the late slots.
export function hoursError(openTime: string, closeTime: string): string | null {
  if (!openTime.endsWith(':00') || !closeTime.endsWith(':00')) {
    return 'Use whole hours for opening and closing times, for example 06:00 and 23:00';
  }
  const open = Number.parseInt(openTime, 10);
  const close = Number.parseInt(closeTime, 10);
  if (close === 0) return open === 0 ? 'Closing time must be different from opening time' : null;
  if (close <= open) return 'Closing time must be after opening time, or 00:00 for midnight. Slots after midnight are not supported yet';
  return null;
}
