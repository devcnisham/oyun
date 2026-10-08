import { expect, test } from 'vitest';
import { type ApplicationFields, validateApplication } from './application';

const valid: ApplicationFields = {
  ownerName: 'Ravi Kumar',
  ownerPhone: '9876543210',
  ownerEmail: 'ravi@example.com',
  whatsapp: '',
  turfName: 'Kick Off Arena',
  area: 'Kadri',
  address: 'Near Kadri Park, Mangalore 575002',
  size: '5-a-side',
  surface: 'Artificial grass',
  openTime: '06:00',
  closeTime: '23:00',
  weekdayPrice: '1000',
  eveningPrice: '1200',
  weekendPrice: '1300',
  description: 'A floodlit 5-a-side turf with parking and changing rooms.',
} as ApplicationFields;

test('a complete application has no errors', () => {
  expect(validateApplication(valid)).toEqual({});
});

test('phone numbers must be valid Indian mobiles; WhatsApp is optional', () => {
  expect(validateApplication({ ...valid, ownerPhone: '1234567890' }).ownerPhone).toBeDefined();
  expect(validateApplication({ ...valid, ownerPhone: '+91 98765 43210' }).ownerPhone).toBeUndefined();
  expect(validateApplication({ ...valid, whatsapp: '12345' }).whatsapp).toBeDefined();
});

test('email, times and description are checked', () => {
  const e = validateApplication({ ...valid, ownerEmail: 'not-an-email', closeTime: '06:00', description: 'short' });
  expect(Object.keys(e).sort()).toEqual(['closeTime', 'description', 'ownerEmail']);
});

test('only the requested steps are validated', () => {
  const empty = Object.fromEntries(Object.keys(valid).map((k) => [k, ''])) as unknown as ApplicationFields;
  const step1 = Object.keys(validateApplication(empty, [1]));
  const all = Object.keys(validateApplication(empty));
  expect(step1.length).toBeGreaterThan(0);
  expect(step1.length).toBeLessThan(all.length);
});
