import 'server-only';
import { NextResponse } from 'next/server';
import { getSessionSubject } from '@/modules/shared/backend/session';
import { readStudentId } from '@/modules/shared/backend/student-id-storage';
import { getDb } from '@/modules/shared/database/store';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Shows an admin the ID photo of a player whose check is pending. Nobody else can fetch it.
export async function GET(_req: Request, { params }: { params: Promise<{ playerId: string }> }) {
  if (!(await getSessionSubject('admin'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { playerId } = await params;
  const player = (await getDb()).players.find((p) => p.id === playerId);
  const idPath = player?.student?.status === 'pending' ? player.student.idPath : undefined;
  if (!idPath) return NextResponse.json({ error: 'No pending ID for this player' }, { status: 404 });
  const bytes = await readStudentId(idPath);
  if (!bytes) return NextResponse.json({ error: 'The photo could not be found' }, { status: 404 });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': TYPES[idPath.split('.').pop() ?? ''] ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  });
}
