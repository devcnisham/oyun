'use server';

import { ValidationError } from './errors';
import { newId } from './ids';
import { normalizePhone } from './pricing';
import { sharedRateLimit } from './shared-rate-limit';
import { getDb, mutate } from './store';
import { istNow } from './time';
import type { Tournament, TournamentTeam } from './types';

export interface RegisterTournamentTeamRequest {
  tournamentId: string;
  teamName: string;
  captainName: string;
  captainPhone: string;
}

const DEFAULT_TOURNAMENTS: Omit<Tournament, 'id' | 'createdAt' | 'registeredTeams'>[] = [
  {
    title: 'Mangalore Champions Cup 2026',
    sport: 'Football',
    turfId: 'perfect-pass-kodialbail',
    turfName: 'Perfect Pass (Kodialbail)',
    startDate: '2026-11-15',
    endDate: '2026-11-16',
    registrationDeadline: '2026-11-10',
    format: '7-a-side Knockout',
    entryFee: 1500,
    prizePool: '₹25,000 + Trophy',
    maxTeams: 16,
    status: 'upcoming',
  },
  {
    title: 'Karavali Box Cricket League',
    sport: 'Box Cricket',
    turfId: 'mangala-magnus-vidyanagara',
    turfName: 'Mangala Magnus (Vidyanagara)',
    startDate: '2026-11-22',
    endDate: '2026-11-23',
    registrationDeadline: '2026-11-18',
    format: '6-a-side Group & Knockout',
    entryFee: 1200,
    prizePool: '₹15,000 + Trophy',
    maxTeams: 12,
    status: 'upcoming',
  },
];

export async function getTournaments(): Promise<Tournament[]> {
  const db = await getDb();
  if (!db.tournaments || db.tournaments.length === 0) {
    // Seed default launch tournaments if none exist
    await mutate((draft) => {
      draft.tournaments ??= [];
      if (draft.tournaments.length === 0) {
        for (const t of DEFAULT_TOURNAMENTS) {
          draft.tournaments.push({
            ...t,
            id: newId('tour'),
            registeredTeams: [],
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
  }

  const refreshed = await getDb();
  return (refreshed.tournaments ?? []).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function registerTournamentTeam(
  req: RegisterTournamentTeamRequest
): Promise<{ ok: boolean; tournament?: Tournament; team?: TournamentTeam; error?: string }> {
  try {
    const phone = normalizePhone(req.captainPhone);
    if (phone.length !== 10) throw new ValidationError('Enter a valid 10-digit captain mobile number');
    if (!String(req.captainName ?? '').trim()) throw new ValidationError('Enter team captain name');
    if (!String(req.teamName ?? '').trim()) throw new ValidationError('Enter team name');

    if (!(await sharedRateLimit(`tour-reg:${phone}`, 10, 60_000))) {
      throw new ValidationError('Too many requests. Please try again later.');
    }

    const team: TournamentTeam = {
      teamName: req.teamName.trim().slice(0, 60),
      captainName: req.captainName.trim().slice(0, 80),
      captainPhone: phone,
      registeredAt: new Date().toISOString(),
    };

    const updatedTour = await mutate((db) => {
      db.tournaments ??= [];
      const tournament = db.tournaments.find((t) => t.id === req.tournamentId);
      if (!tournament) throw new ValidationError('Tournament not found');

      if (tournament.status !== 'upcoming') {
        throw new ValidationError('Tournament registration is closed');
      }

      const today = istNow().date;
      if (today > tournament.registrationDeadline) {
        throw new ValidationError('Registration deadline has passed');
      }

      if (tournament.registeredTeams.length >= tournament.maxTeams) {
        throw new ValidationError('Tournament has reached maximum team capacity');
      }

      const nameLower = team.teamName.toLowerCase();
      if (
        tournament.registeredTeams.some(
          (t) => t.teamName.toLowerCase() === nameLower || t.captainPhone === phone
        )
      ) {
        throw new ValidationError('This team name or captain phone is already registered');
      }

      tournament.registeredTeams.push(team);

      if (tournament.registeredTeams.length >= tournament.maxTeams) {
        tournament.status = 'ongoing';
      }

      return tournament;
    });

    return { ok: true, tournament: updatedTour, team };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    console.error('[tournaments] registerTournamentTeam error:', err);
    return { ok: false, error: 'Could not register team. Please try again.' };
  }
}
