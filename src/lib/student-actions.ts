'use server';

import { platformOffersOf } from './platform-offers';
import { normalizePhone } from './pricing';
import { getDb } from './store';
import type { StudentStatus } from './types';

export interface StudentInfo {
  offerActive: boolean;
  title: string;
  percentOff: number;
  status: StudentStatus | 'none';
  note: string | null; // why an ID was not approved
}

// What the checkout needs to show about the student offer for this phone number. Public: it reveals only the
// state of the check, never the photo or any other detail.
export async function getStudentInfo(phone: string): Promise<StudentInfo> {
  const db = await getDb();
  const offer = platformOffersOf(db.settings).student;
  const digits = normalizePhone(String(phone ?? ''));
  const player = digits.length === 10 ? db.players.find((p) => p.phone === digits) : undefined;
  return {
    offerActive: offer.active,
    title: offer.title,
    percentOff: offer.percentOff,
    status: player?.student?.status ?? 'none',
    note: player?.student?.status === 'rejected' ? player.student.note ?? null : null,
  };
}
