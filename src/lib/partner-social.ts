import type { Database } from './types';

// The OYUN operations account manages the launch turfs and signs in with its own environment password only
const OPS_PARTNER_ID = 'partner_oyun';

/**
 * Which partner login a verified Clerk (Google or Apple) email belongs to. Only accounts an admin has already approved
 * qualify: an active owner, or a staff member of an active owner. Anyone else gets null and is asked to apply.
 * The caller must pass an email Clerk reports as verified.
 */
export function partnerSubjectForEmail(db: Pick<Database, 'partners' | 'staff'>, rawEmail: string): string | null {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return null;
  const partner = db.partners.find((p) => p.id !== OPS_PARTNER_ID && p.email.trim().toLowerCase() === email);
  if (partner) return partner.status === 'active' ? `p:${partner.id}` : null;
  const staff = db.staff.find((s) => s.email.trim().toLowerCase() === email);
  if (staff) {
    const owner = db.partners.find((p) => p.id === staff.partnerId);
    return owner && owner.id !== OPS_PARTNER_ID && owner.status === 'active' ? `s:${staff.id}` : null;
  }
  return null;
}
