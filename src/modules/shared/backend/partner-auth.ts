import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionSubject } from '@/modules/shared/backend/session';
import { getDb } from '@/modules/shared/database/store';
import type { Partner, StaffMember, Turf } from '@/modules/shared/database/types';

export type PartnerRole = 'owner' | 'manager' | 'front_desk';

export type Permission =
  | 'bookings'
  | 'checkin'
  | 'slots'
  | 'pricing'
  | 'offers'
  | 'addons'
  | 'turf'
  | 'staff'
  | 'payouts';

export const PERMISSIONS: Record<PartnerRole, Permission[]> = {
  owner: ['bookings', 'checkin', 'slots', 'pricing', 'offers', 'addons', 'turf', 'staff', 'payouts'],
  manager: ['bookings', 'checkin', 'slots', 'pricing', 'offers', 'addons', 'turf'],
  front_desk: ['bookings', 'checkin', 'slots'],
};

export const ROLE_LABELS: Record<PartnerRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  front_desk: 'Front desk',
};

export const TURF_COOKIE = 'sa_partner_turf';

export interface PartnerContext {
  partner: Partner;
  staff: StaffMember | null;
  role: PartnerRole;
  userName: string;
  turfs: Turf[];
  turf: Turf;
  can: (permission: Permission) => boolean;
}

export async function getPartnerContext(): Promise<PartnerContext | null> {
  const subject = await getSessionSubject('partner');
  if (!subject) return null;

  const db = await getDb();
  let partner: Partner | undefined;
  let staff: StaffMember | null = null;
  if (subject.startsWith('p:')) {
    partner = db.partners.find((p) => p.id === subject.slice(2));
  } else if (subject.startsWith('s:')) {
    staff = db.staff.find((s) => s.id === subject.slice(2)) ?? null;
    partner = staff ? db.partners.find((p) => p.id === staff!.partnerId) : undefined;
  }
  if (!partner || partner.status !== 'active') return null;

  const turfs = db.turfs.filter((t) => t.partnerId === partner.id);
  if (turfs.length === 0) return null;

  const selectedId = (await cookies()).get(TURF_COOKIE)?.value;
  const turf = turfs.find((t) => t.id === selectedId) ?? turfs[0];
  const role: PartnerRole = staff ? staff.role : 'owner';

  return {
    partner,
    staff,
    role,
    userName: staff ? staff.name : partner.name,
    turfs,
    turf,
    can: (permission) => PERMISSIONS[role].includes(permission),
  };
}

// For pages: send to login, or back to the dashboard if this role can't open the page
export async function requirePartner(permission?: Permission) {
  const ctx = await getPartnerContext();
  if (!ctx) redirect('/partner/login');
  if (permission && !ctx.can(permission)) redirect('/partner');
  return ctx;
}

export class AccessError extends Error {}

// For server actions: throw instead of redirecting so the form can show the message
export async function requirePartnerAction(permission: Permission) {
  const ctx = await getPartnerContext();
  if (!ctx) throw new AccessError('Your session has expired. Please log in again.');
  if (!ctx.can(permission)) throw new AccessError('You do not have permission to do this.');
  return ctx;
}
