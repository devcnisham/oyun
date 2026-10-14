// "List your turf" form rules, shared by the browser (instant feedback) and the server (the real check)
import { hoursError } from '../hours';


export interface ApplicationFields {
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  whatsapp: string;
  turfName: string;
  area: string;
  address: string;
  size: string;
  surface: string;
  openTime: string;
  closeTime: string;
  weekdayPrice: string;
  eveningPrice: string;
  weekendPrice: string;
  description: string;
}

export type FieldErrors = Partial<Record<keyof ApplicationFields, string>>;

export const STEP_FIELDS: Record<number, (keyof ApplicationFields)[]> = {
  1: ['ownerName', 'ownerPhone', 'ownerEmail', 'whatsapp'],
  2: ['turfName', 'area', 'size', 'address', 'surface', 'openTime', 'closeTime'],
  3: ['weekdayPrice', 'eveningPrice', 'weekendPrice'],
  4: ['description'],
};

const digits = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
};
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function price(v: string, label: string): string | undefined {
  if (!v.trim()) return `Enter the ${label}`;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 100 || n > 20000) return `${label[0].toUpperCase()}${label.slice(1)} must be between ₹100 and ₹20,000`;
}

export function validateApplication(f: ApplicationFields, steps: number[] = [1, 2, 3, 4]): FieldErrors {
  const e: FieldErrors = {};
  const want = new Set(steps.flatMap((s) => STEP_FIELDS[s] ?? []));
  const check = (key: keyof ApplicationFields, msg: string | undefined | false) => {
    if (want.has(key) && msg) e[key] = msg;
  };
  const t = (k: keyof ApplicationFields) => String(f[k] ?? '').trim();

  check('ownerName', t('ownerName').length < 2 ? 'Enter your full name' : t('ownerName').length > 80 && 'Name is too long');
  check('ownerPhone', !/^[6-9]\d{9}$/.test(digits(t('ownerPhone'))) && 'Enter a valid 10-digit Indian mobile number');
  check('ownerEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t('ownerEmail')) ? 'Enter a valid email address (you will use it to log in)' : t('ownerEmail').length > 120 && 'Email is too long');
  check('whatsapp', t('whatsapp') !== '' && !/^[6-9]\d{9}$/.test(digits(t('whatsapp'))) && 'Enter a valid 10-digit WhatsApp number or leave it blank');
  check('turfName', t('turfName').length < 3 ? 'Enter the turf name' : t('turfName').length > 80 && 'Turf name is too long');
  check('area', !t('area') && 'Choose an area');
  check('size', !t('size') && 'Choose the turf format');
  check('address', t('address').length < 10 ? 'Enter the full address with a landmark' : t('address').length > 300 && 'Address is too long');
  check('surface', !t('surface') && 'Choose the surface type');
  check('openTime', !TIME.test(t('openTime')) && 'Enter an opening time');
  check('closeTime', !TIME.test(t('closeTime')) ? 'Enter a closing time' : hoursError(t('openTime'), t('closeTime')) ?? false);
  check('weekdayPrice', price(t('weekdayPrice'), 'weekday rate'));
  check('eveningPrice', price(t('eveningPrice'), 'evening rate'));
  check('weekendPrice', price(t('weekendPrice'), 'weekend rate'));
  check('description', t('description').length < 20 ? 'Describe your turf in at least 20 characters' : t('description').length > 1000 && 'Keep the description under 1000 characters');
  return e;
}
