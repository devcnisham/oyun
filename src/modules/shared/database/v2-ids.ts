import { createHash } from 'node:crypto';

/*
 * The app's players and bookings have text ids (pl_..., bk_...); the oyun schema uses uuids. A uuid is
 * derived from the text id (RFC 4122 version 5, SHA-1 over a fixed namespace), so the same id always gives
 * the same uuid: writes need no lookup, and a retry cannot create a second row. The reverse direction
 * uses the legacy_id columns (supabase/migrations/20261017000000_v2_priced_confirm.sql).
 */
const NAMESPACE = Buffer.from('6f79756e2d6172656e612d76322d6964'.padEnd(32, '0'), 'hex'); // "oyun-arena-v2-id"

export type V2IdKind = 'player' | 'booking';

export function legacyToUuid(kind: V2IdKind, legacyId: string): string {
  if (!legacyId) throw new Error('legacyToUuid: empty id');
  const hash = createHash('sha1').update(NAMESPACE).update(`${kind}:${legacyId}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = hash.subarray(0, 16).toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
