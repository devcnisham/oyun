import type { Database } from './types';
import { newId } from './store';

const KEEP = 1000; // newest entries kept across the whole database

// Adds one line to the activity log inside an existing mutate() call, so it is saved with the change it describes
export function logActivity(
  db: Database,
  ctx: { partner: { id: string }; turf: { id: string }; userName: string },
  action: string,
  detail: string,
) {
  const list = (db.activity ??= []);
  list.push({ id: newId('act'), partnerId: ctx.partner?.id ?? '', turfId: ctx.turf?.id ?? '', at: new Date().toISOString(), by: ctx.userName, action, detail: detail.slice(0, 200) });
  if (list.length > KEEP) list.splice(0, list.length - KEEP);
}
