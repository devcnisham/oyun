import { revalidatePath } from 'next/cache';
import { hoursError } from './hours';
import { AccessError } from './partner-auth';
import { ValidationError } from './errors';
import type { ActionResult, Turf } from './types';
import { MAX_TURF_IMAGES, isSafeTurfImage } from './validation/site-content';

export { ValidationError };

export function str(fd: FormData, key: string, max = 500) {
  return String(fd.get(key) ?? '').trim().slice(0, max);
}

export function required(fd: FormData, key: string, label: string, max = 500) {
  const v = str(fd, key, max);
  if (!v) throw new ValidationError(`${label} is required`);
  return v;
}

export function int(fd: FormData, key: string, { min = -Infinity, max = Infinity, label = key } = {}) {
  const raw = str(fd, key);
  const n = Number(raw);
  if (raw === '' || !Number.isFinite(n)) throw new ValidationError(`${label} must be a number`);
  if (n < min || n > max) throw new ValidationError(`${label} must be between ${min} and ${max}`);
  return Math.round(n);
}

export function bool(fd: FormData, key: string) {
  return fd.get(key) === 'on' || fd.get(key) === 'true';
}

function list(value: string, sep: RegExp = /[,\n]/) {
  return value.split(sep).map((s) => s.trim()).filter(Boolean);
}

export function phone10(fd: FormData, key: string, label = 'Phone number') {
  const digits = str(fd, key).replace(/\D/g, '');
  const p = digits.length > 10 ? digits.slice(-10) : digits;
  if (p.length !== 10) throw new ValidationError(`${label} must have 10 digits`);
  return p;
}

// Every mutation can change public pages and dashboards, so refresh everything
export function refreshAll() {
  try {
    revalidatePath('/', 'layout');
  } catch {
    // In test environment or non-request context, revalidatePath is a no-op
  }
}

// Turns thrown access/validation errors into a form message, catching unexpected errors to prevent crashes
export async function run(fn: () => ActionResult | Promise<ActionResult>): Promise<ActionResult> {
  try {
    const result = await fn();
    refreshAll();
    return result;
  } catch (err) {
    if (err instanceof ValidationError || err instanceof AccessError) return { error: err.message };
    console.error('[action] unhandled error in action:', err);
    try {
      const { reportError } = await import('./monitoring');
      await reportError({
        source: 'server',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        path: 'server-action',
      });
    } catch {}
    return { error: 'Something went wrong. Please try again in a moment.' };
  }
}

export const AMENITY_OPTIONS = [
  'Changing Rooms', 'Parking', 'Floodlights', 'Drinking Water', 'Restrooms',
  'Seating Area', 'Café', 'AC Lobby', 'First Aid', 'WiFi', 'Showers', 'Equipment Rental',
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Shared by the partner "My turf" page and the admin turf editor.
// phoneOptional: admins can save a venue before its number is known (drafts like the Pickleball venues)
export function parseTurfProfile(fd: FormData, { phoneOptional = false } = {}): Partial<Turf> {
  const openTime = required(fd, 'openTime', 'Opening time', 5);
  const closeTime = required(fd, 'closeTime', 'Closing time', 5);
  if (!TIME_RE.test(openTime) || !TIME_RE.test(closeTime)) throw new ValidationError('Times must look like 06:00');
  const hoursProblem = hoursError(openTime, closeTime);
  if (hoursProblem) throw new ValidationError(hoursProblem);

  const images = list(str(fd, 'images', 4000), /\n/);
  if (images.some((u) => !isSafeTurfImage(u))) {
    throw new ValidationError('Each image must be a /path on this site or a plain https:// link (no //host, no login in the link)');
  }
  if (images.length === 0) throw new ValidationError('Add at least one image (a /path or https:// link)');
  if (images.length > MAX_TURF_IMAGES) throw new ValidationError(`Use at most ${MAX_TURF_IMAGES} images`);

  return {
    name: required(fd, 'name', 'Turf name', 80),
    area: required(fd, 'area', 'Area', 60),
    location: required(fd, 'location', 'Location', 160),
    phone: phoneOptional ? str(fd, 'phone', 20) : required(fd, 'phone', 'Contact phone', 20),
    ownerName: required(fd, 'ownerName', 'Contact name', 80),
    description: required(fd, 'description', 'Description', 1000),
    pricePerHour: int(fd, 'pricePerHour', { min: 100, max: 20000, label: 'Base price' }),
    openTime,
    closeTime,
    size: required(fd, 'size', 'Size', 40),
    surface: required(fd, 'surface', 'Surface', 60),
    formats: list(str(fd, 'formats', 200)),
    sports: list(str(fd, 'sports', 200)),
    amenities: fd.getAll('amenities').map(String).filter((a) => AMENITY_OPTIONS.includes(a)),
    images,
  };
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'turf';
}
