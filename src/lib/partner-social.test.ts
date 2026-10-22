import { describe, expect, test } from 'vitest';
import { partnerSubjectForEmail } from './partner-social';
import type { Partner, StaffMember } from './types';

const partner = (over: Partial<Partner>): Partner => ({ id: 'p1', name: 'Owner', email: 'owner@example.com', phone: '9876543210', passwordHash: 'x', status: 'active', business: {} as Partner['business'], createdAt: '', ...over });
const staff = (over: Partial<StaffMember>): StaffMember => ({ id: 's1', partnerId: 'p1', name: 'Desk', email: 'desk@example.com', phone: '9876543211', role: 'front_desk', passwordHash: 'x', createdAt: '', ...over });

describe('partnerSubjectForEmail (Google / Apple partner sign-in)', () => {
  const db = {
    partners: [partner({}), partner({ id: 'p2', email: 'gone@example.com', status: 'suspended' }), partner({ id: 'partner_oyun', email: 'ops@oyun.co.in' })],
    staff: [staff({}), staff({ id: 's2', partnerId: 'p2', email: 'orphan@example.com' }), staff({ id: 's3', partnerId: 'partner_oyun', email: 'opsdesk@example.com' })],
  };

  test('an approved active owner signs in, whatever the email casing', () => {
    expect(partnerSubjectForEmail(db, 'owner@example.com')).toBe('p:p1');
    expect(partnerSubjectForEmail(db, '  Owner@Example.COM ')).toBe('p:p1');
  });

  test('staff of an active owner sign in as staff', () => {
    expect(partnerSubjectForEmail(db, 'desk@example.com')).toBe('s:s1');
  });

  test('unknown emails, suspended owners and their staff do not get in', () => {
    expect(partnerSubjectForEmail(db, 'stranger@example.com')).toBeNull();
    expect(partnerSubjectForEmail(db, 'gone@example.com')).toBeNull();
    expect(partnerSubjectForEmail(db, 'orphan@example.com')).toBeNull();
    expect(partnerSubjectForEmail(db, '')).toBeNull();
  });

  test('the OYUN operations account and its staff never sign in through Google or Apple unless the email is listed', () => {
    expect(partnerSubjectForEmail(db, 'ops@oyun.co.in')).toBeNull();
    expect(partnerSubjectForEmail(db, 'opsdesk@example.com')).toBeNull();
    expect(partnerSubjectForEmail(db, 'ops@oyun.co.in', 'someone@else.com')).toBeNull();
  });

  test('a listed operations email signs in as the operations account, whatever the casing or spacing', () => {
    expect(partnerSubjectForEmail(db, 'boss@example.com', 'a@b.com, Boss@Example.com')).toBe('p:partner_oyun');
    expect(partnerSubjectForEmail(db, '  BOSS@example.com ', 'boss@example.com')).toBe('p:partner_oyun');
  });

  test('the allowlist never admits a suspended or missing operations account, and an empty list admits nobody', () => {
    const suspended = { ...db, partners: db.partners.map((p) => (p.id === 'partner_oyun' ? { ...p, status: 'suspended' as const } : p)) };
    expect(partnerSubjectForEmail(suspended, 'boss@example.com', 'boss@example.com')).toBeNull();
    expect(partnerSubjectForEmail({ partners: [], staff: [] }, 'boss@example.com', 'boss@example.com')).toBeNull();
    expect(partnerSubjectForEmail(db, 'boss@example.com', '')).toBeNull();
    expect(partnerSubjectForEmail(db, 'boss@example.com', ' , ')).toBeNull();
  });
});
