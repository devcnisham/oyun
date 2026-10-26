'use client';

import type { PitchSide, PitchSize } from '@/modules/shared/database/types';

// What a player has picked on a venue page, kept in this browser so a refresh (or a dropped connection) does not lose it.
// The held slots themselves live on the server against this device's cookie; this only remembers the choices.
export interface BookingDraft {
  turfId: string;
  date: string;
  hours: number[];
  size: PitchSize;
  side?: PitchSide;
  bookableId?: string;
  holdUntil: number | null; // epoch ms the hold ends, when the player had already moved to checkout
  name: string;
  phone: string;
  code: string;
  promo: string | null;
  useWallet: boolean;
  addOns: { id: string; qty: number }[];
  savedAt: number;
}

// A draft older than this is forgotten: the day's slots have moved on
export const DRAFT_TTL_MS = 45 * 60 * 1000;
const key = (turfId: string) => `oyun_draft_${turfId}`;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Reads a saved draft defensively: anything malformed, for another venue or too old is dropped. */
export function parseDraft(raw: string | null, turfId: string, now: number): BookingDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<BookingDraft>;
    if (!d || d.turfId !== turfId || !isNum(d.savedAt) || now - d.savedAt > DRAFT_TTL_MS || d.savedAt > now + 60_000) return null;
    if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return null;
    if (!Array.isArray(d.hours) || !d.hours.every((h) => isNum(h) && h >= 0 && h < 24) || d.hours.length > 12) return null;
    if (d.size !== 'full' && d.size !== 'half') return null;
    if (d.side !== undefined && d.side !== 'A' && d.side !== 'B') return null;
    return {
      turfId,
      date: d.date,
      hours: d.hours,
      size: d.size,
      side: d.side,
      bookableId: typeof d.bookableId === 'string' ? d.bookableId.slice(0, 80) : undefined,
      holdUntil: isNum(d.holdUntil) ? d.holdUntil : null,
      name: typeof d.name === 'string' ? d.name.slice(0, 80) : '',
      phone: typeof d.phone === 'string' ? d.phone.slice(0, 20) : '',
      code: typeof d.code === 'string' ? d.code.slice(0, 20) : '',
      promo: typeof d.promo === 'string' ? d.promo.slice(0, 40) : null,
      useWallet: d.useWallet === true,
      addOns: Array.isArray(d.addOns) ? d.addOns.filter((a) => a && typeof a.id === 'string' && isNum(a.qty) && a.qty > 0 && a.qty <= 20).slice(0, 20) : [],
      savedAt: d.savedAt,
    };
  } catch {
    return null;
  }
}

export function loadDraft(turfId: string, now: number = Date.now()): BookingDraft | null {
  try {
    return parseDraft(localStorage.getItem(key(turfId)), turfId, now);
  } catch {
    return null;
  }
}

export function saveDraft(draft: BookingDraft) {
  try {
    localStorage.setItem(key(draft.turfId), JSON.stringify(draft));
  } catch {}
}

export function clearDraft(turfId: string) {
  try {
    localStorage.removeItem(key(turfId));
  } catch {}
}
