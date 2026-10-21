import type { Database } from './types';
import { newId } from './store';

const KEEP = 1000; // newest entries kept per partner

// Adds one line to the activity log inside an existing mutate() call, so it is saved with the change it describes
export function logActivity(
  db: Database,
  ctx: { partner: { id: string }; turf: { id: string }; userName: string },
  action: string,
  detail: string,
) {
  const list = (db.activity ??= []);
  list.push({ id: newId('act'), partnerId: ctx.partner.id, turfId: ctx.turf.id, at: new Date().toISOString(), by: ctx.userName, action, detail: detail.slice(0, 200) });
  // Trim only this partner's oldest entries, so a busy venue never pushes out another's history
  const mine = list.filter((a) => a.partnerId === ctx.partner.id);
  if (mine.length > KEEP) {
    const drop = new Set(mine.slice(0, mine.length - KEEP).map((a) => a.id));
    db.activity = list.filter((a) => !drop.has(a.id));
  }
}
