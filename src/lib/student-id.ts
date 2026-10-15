import type { Database, Player } from './types';

// Rules for student ID checks. Pure, so the browser, the server and the tests share them.

export const STUDENT_ID_MAX_BYTES = 5 * 1024 * 1024;
export const STUDENT_ID_EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
/** A photo nobody has looked at after this long is deleted. */
export const STUDENT_ID_PENDING_DAYS = 30;
export const DEFAULT_REJECT_NOTE = 'We could not read your ID. Please send a clear photo of your student ID card.';

/** Checks the file about to be stored. Returns the message to show, or null when it is fine. */
export function studentIdFileError(file: { type: string; size: number }): string | null {
  if (!STUDENT_ID_EXTENSIONS[file.type]) return 'Send the ID as a JPEG, PNG or WebP photo';
  if (file.size <= 0) return 'That file is empty';
  if (file.size > STUDENT_ID_MAX_BYTES) return 'The photo is over 5 MB. Please make it smaller and try again.';
  return null;
}

/** Records a new ID photo on the player. Returns the path of the photo it replaces, which the caller must delete. */
export function applyStudentSubmission(player: Player, idPath: string, nowIso: string): string | undefined {
  if (player.student?.status === 'approved') throw new Error('Your student discount is already active');
  const replaced = player.student?.idPath;
  player.student = { status: 'pending', submittedAt: nowIso, idPath };
  return replaced;
}

/** An admin approves or rejects a pending ID. The photo is dropped from the record; returns its path so the caller can delete it. */
export function applyStudentDecision(player: Player, decision: 'approve' | 'reject', note: string, nowIso: string): string | undefined {
  const current = player.student;
  if (!current || current.status !== 'pending') throw new Error('There is no pending student ID for this player');
  const path = current.idPath;
  player.student = {
    status: decision === 'approve' ? 'approved' : 'rejected',
    submittedAt: current.submittedAt,
    reviewedAt: nowIso,
    ...(decision === 'reject' ? { note: note.trim().slice(0, 200) || DEFAULT_REJECT_NOTE } : {}),
  };
  return path;
}

/** Pending photos older than the limit are dropped. Returns the paths to delete. */
export function expireStudentIds(db: Pick<Database, 'players'>, nowIso: string, days = STUDENT_ID_PENDING_DAYS): string[] {
  const cutoff = new Date(Date.parse(nowIso) - days * 24 * 60 * 60 * 1000).toISOString();
  const paths: string[] = [];
  for (const p of db.players ?? []) {
    const s = p.student;
    if (!s || s.status !== 'pending' || s.submittedAt >= cutoff) continue;
    if (s.idPath) paths.push(s.idPath);
    p.student = { status: 'rejected', submittedAt: s.submittedAt, reviewedAt: nowIso, note: 'Your ID was not reviewed in time. Please send it again.' };
  }
  return paths;
}
