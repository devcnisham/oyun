import 'server-only';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createAdminClient, supabaseConfigured } from '@/modules/shared/database/supabase/admin';

// Student ID photos are personal documents: a PRIVATE bucket, never a public URL, and never under public/.
// Only the admin image route reads them. With Supabase configured there is no disk fallback, because a
// serverless disk is temporary and a silent fallback would hide a missing bucket.
const BUCKET = 'student-ids';
const LOCAL_DIR = path.join(process.env.DATA_DIR || (process.env.VERCEL ? path.join(tmpdir(), 'oyun-data') : path.join(process.cwd(), '.data')), 'student-ids');

const localFile = (storagePath: string) => path.join(LOCAL_DIR, path.basename(storagePath));

export class StudentIdStorageError extends Error {}

export async function putStudentId(storagePath: string, data: Buffer, contentType: string): Promise<void> {
  if (supabaseConfigured()) {
    const { error } = await createAdminClient().storage.from(BUCKET).upload(storagePath, data, { contentType, upsert: true });
    if (error) throw new StudentIdStorageError(error.message);
    return;
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(localFile(storagePath), data);
}

export async function readStudentId(storagePath: string): Promise<Buffer | null> {
  try {
    if (supabaseConfigured()) {
      const { data, error } = await createAdminClient().storage.from(BUCKET).download(storagePath);
      return error || !data ? null : Buffer.from(await data.arrayBuffer());
    }
    return await readFile(localFile(storagePath));
  } catch {
    return null;
  }
}

/** Best effort: a photo that is already gone is not an error. */
export async function removeStudentIds(storagePaths: Array<string | undefined>): Promise<void> {
  const paths = storagePaths.filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;
  try {
    if (supabaseConfigured()) await createAdminClient().storage.from(BUCKET).remove(paths);
    else await Promise.all(paths.map((p) => rm(localFile(p), { force: true })));
  } catch (err) {
    console.warn('[student-id] could not remove a stored ID:', err instanceof Error ? err.message : String(err));
  }
}
