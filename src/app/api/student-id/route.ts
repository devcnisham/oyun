import 'server-only';
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { refreshAll } from '@/lib/action-utils';
import { currentAccountId } from '@/lib/current-account';
import { isApprovedStudent, platformOffersOf } from '@/lib/platform-offers';
import { normalizePhone } from '@/lib/pricing';
import { sharedRateLimit } from '@/lib/shared-rate-limit';
import { STUDENT_ID_EXTENSIONS, applyStudentSubmission, studentIdFileError } from '@/lib/student-id';
import { StudentIdStorageError, putStudentId, removeStudentIds } from '@/lib/student-id-storage';
import { getDb, mutate } from '@/lib/store';
import { createPlayer } from '@/lib/wallet';

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

// A player sends a photo of their student ID at checkout. It waits for an admin to approve it.
export async function POST(req: NextRequest) {
  // Only our own pages may send IDs
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (!originHost || !host || originHost !== host) return fail('Forbidden', 403);

  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  if (!(await sharedRateLimit(`student-id:ip:${ip}`, 10, 60 * 60_000))) return fail('Too many tries. Please wait a while and try again.', 429);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const name = String(form?.get('name') ?? '').trim().slice(0, 80);
  const phone = normalizePhone(String(form?.get('phone') ?? ''));
  if (!form || !file || typeof file === 'string') return fail('Choose a photo of your student ID', 400);
  if (!name) return fail('Enter your name first', 400);
  if (phone.length !== 10) return fail('Enter your 10-digit mobile number first', 400);
  const fileError = studentIdFileError(file);
  if (fileError) return fail(fileError, 400);
  if (!(await sharedRateLimit(`student-id:phone:${phone}`, 5, 60 * 60_000))) return fail('Too many tries for this number. Please wait a while and try again.', 429);

  const db = await getDb();
  if (!platformOffersOf(db.settings).student.active) return fail('The student offer is not running right now', 409);

  const accountId = await currentAccountId();
  const existing = (accountId ? db.players.find((p) => p.accountId === accountId) : undefined) ?? db.players.find((p) => p.phone === phone);
  if (existing?.status === 'banned') return fail('This number cannot be used. Contact support.', 403);
  if (isApprovedStudent(existing)) return fail('Your student discount is already active', 409);
  // A number tied to a signed-in account can only send its ID from that account
  if (existing?.accountId && existing.accountId !== accountId) return fail('Sign in to the account that uses this number to send your ID.', 403);

  const storagePath = `ids/${randomBytes(16).toString('hex')}.${STUDENT_ID_EXTENSIONS[file.type]}`;
  try {
    await putStudentId(storagePath, Buffer.from(await file.arrayBuffer()), file.type);
  } catch (err) {
    console.error('[student-id] storing the ID failed:', err instanceof StudentIdStorageError ? err.message : err);
    return fail('ID uploads are not available right now. Please try again later.', 503);
  }

  let replaced: string | undefined;
  try {
    await mutate((data) => {
      const player = data.players.find((p) => p.id === existing?.id) ?? createPlayer(data, name, phone, null, accountId);
      replaced = applyStudentSubmission(player, storagePath, new Date().toISOString());
    });
  } catch (err) {
    await removeStudentIds([storagePath]);
    return fail(err instanceof Error ? err.message : 'Could not save your ID. Please try again.', 409);
  }
  await removeStudentIds([replaced]);
  // The upload joins the admin Student IDs queue
  refreshAll();
  return NextResponse.json({ ok: true, status: 'pending' });
}
