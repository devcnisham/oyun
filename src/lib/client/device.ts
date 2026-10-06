'use client';

// Things this browser remembers for the player. Storage can throw (private mode), so every access is guarded.

const PROFILE_KEY = 'oyun_profile';
// Fired on window when the saved profile or booking list changes, so the top bar can update
export const DEVICE_EVENT = 'oyun:device';
const BOOKINGS_KEY = 'oyun_bookings';
const AREA_KEY = 'oyun_area';

export interface DeviceProfile {
  name: string;
  phone: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getProfile(): DeviceProfile {
  const p = read<Partial<DeviceProfile>>(PROFILE_KEY, {});
  return { name: typeof p.name === 'string' ? p.name : '', phone: typeof p.phone === 'string' ? p.phone : '' };
}

export function saveProfile(profile: DeviceProfile) {
  write(PROFILE_KEY, { name: profile.name.slice(0, 80), phone: profile.phone.slice(0, 20) });
  window.dispatchEvent(new Event(DEVICE_EVENT));
}

export function getMyBookingIds(): string[] {
  const ids = read<unknown>(BOOKINGS_KEY, []);
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

export function addMyBookingIds(ids: string[]) {
  write(BOOKINGS_KEY, [...new Set([...ids, ...getMyBookingIds()])].slice(0, 100));
  window.dispatchEvent(new Event(DEVICE_EVENT));
}

export function clearDevice() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(BOOKINGS_KEY);
  } catch {}
  window.dispatchEvent(new Event(DEVICE_EVENT));
}

// The area chosen in the top bar's "Playing in …" strip
export function getPreferredArea(): string {
  const a = read<unknown>(AREA_KEY, '');
  return typeof a === 'string' ? a.slice(0, 60) : '';
}

export function setPreferredArea(area: string) {
  write(AREA_KEY, area.slice(0, 60));
}
