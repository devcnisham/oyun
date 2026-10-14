'use server';

import { ValidationError } from './errors';
import { newId } from './ids';
import { normalizePhone } from './pricing';
import { sharedRateLimit } from './shared-rate-limit';
import { getDb, mutate } from './store';
import { addDays, formatHour, isValidDate, istNow } from './time';
import type { OpenMatch } from './types';

export interface CreateOpenMatchRequest {
  turfId: string;
  sport: string;
  date: string;
  hour: number;
  format?: string;
  hostName: string;
  hostPhone: string;
  playersNeeded: number;
}

export interface JoinOpenMatchRequest {
  matchId: string;
  playerName: string;
  playerPhone: string;
}

export async function listOpenMatches(): Promise<OpenMatch[]> {
  const db = await getDb();
  db.openMatches ??= [];
  const today = istNow().date;

  return db.openMatches
    .filter((m) => m.date >= today && m.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
}

export async function createOpenMatch(req: CreateOpenMatchRequest): Promise<{ ok: boolean; match?: OpenMatch; error?: string }> {
  try {
    const phone = normalizePhone(req.hostPhone);
    if (phone.length !== 10) throw new ValidationError('Enter a valid 10-digit mobile number');
    if (!String(req.hostName ?? '').trim()) throw new ValidationError('Enter your name');
    if (req.hour < 0 || req.hour > 23) throw new ValidationError('Invalid hour');

    const today = istNow().date;
    if (!isValidDate(req.date) || req.date < today || req.date > addDays(today, 14)) {
      throw new ValidationError('Date must be within the next 14 days');
    }

    const needed = Math.max(1, Math.min(20, Math.round(Number(req.playersNeeded) || 1)));

    if (!(await sharedRateLimit(`create-match:${phone}`, 10, 60_000))) {
      throw new ValidationError('Too many requests. Please try again later.');
    }

    const match = await mutate((db) => {
      db.openMatches ??= [];
      const turf = db.turfs.find((t) => t.id === req.turfId);
      if (!turf) throw new ValidationError('Turf not found');

      const id = newId('match');
      const timeLabel = formatHour(req.hour);

      const entry: OpenMatch = {
        id,
        turfId: turf.id,
        turfName: turf.name,
        sport: req.sport || turf.sports[0] || 'Football',
        date: req.date,
        hour: req.hour,
        timeLabel,
        format: req.format || turf.size || '5-a-side',
        hostName: req.hostName.trim().slice(0, 80),
        hostPhone: phone,
        playersNeeded: needed,
        playersJoined: [],
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      db.openMatches.push(entry);
      return entry;
    });

    return { ok: true, match };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    console.error('[community] createOpenMatch error:', err);
    return { ok: false, error: 'Could not create match. Please try again.' };
  }
}

export async function joinOpenMatch(req: JoinOpenMatchRequest): Promise<{ ok: boolean; match?: OpenMatch; error?: string }> {
  try {
    const phone = normalizePhone(req.playerPhone);
    if (phone.length !== 10) throw new ValidationError('Enter a valid 10-digit mobile number');
    if (!String(req.playerName ?? '').trim()) throw new ValidationError('Enter your name');

    if (!(await sharedRateLimit(`join-match:${phone}`, 20, 60_000))) {
      throw new ValidationError('Too many requests. Please try again later.');
    }

    const updated = await mutate((db) => {
      db.openMatches ??= [];
      const match = db.openMatches.find((m) => m.id === req.matchId);
      if (!match) throw new ValidationError('Match not found');

      if (match.status !== 'open') {
        throw new ValidationError('This match is no longer open for new players');
      }

      if (match.hostPhone === phone || match.playersJoined.some((p) => p.phone === phone)) {
        throw new ValidationError('You have already joined this match');
      }

      match.playersJoined.push({
        name: req.playerName.trim().slice(0, 80),
        phone,
        joinedAt: new Date().toISOString(),
      });

      if (match.playersJoined.length >= match.playersNeeded) {
        match.status = 'full';
      }

      return match;
    });

    return { ok: true, match: updated };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    console.error('[community] joinOpenMatch error:', err);
    return { ok: false, error: 'Could not join match. Please try again.' };
  }
}
