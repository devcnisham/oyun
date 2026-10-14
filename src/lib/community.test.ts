import { beforeEach, describe, expect, test } from 'vitest';
import { createOpenMatch, joinOpenMatch, listOpenMatches } from './community';
import { getTournaments, registerTournamentTeam } from './tournaments';
import { mutate } from './store';
import { addDays, istNow } from './time';

describe('Player community, open matches, and tournaments (P13-01, P13-02)', () => {
  const turfId = 'perfect-pass-kodialbail';
  const today = istNow().date;
  const tomorrow = addDays(today, 1);

  beforeEach(async () => {
    await mutate((db) => {
      db.openMatches = [];
      db.tournaments = [];
    });
  });

  describe('Open Matches (P13-01)', () => {
    test('creates an open match and lists it', async () => {
      const res = await createOpenMatch({
        turfId,
        sport: 'Football',
        date: tomorrow,
        hour: 19,
        format: '5-a-side',
        hostName: 'Captain Rohan',
        hostPhone: '9876500111',
        playersNeeded: 3,
      });

      expect(res.ok).toBe(true);
      expect(res.match?.id).toMatch(/^match_/);
      expect(res.match?.playersNeeded).toBe(3);
      expect(res.match?.status).toBe('open');

      const matches = await listOpenMatches();
      expect(matches).toHaveLength(1);
      expect(matches[0].hostName).toBe('Captain Rohan');
    });

    test('joining an open match updates playersJoined and marks full when capacity reached', async () => {
      const createRes = await createOpenMatch({
        turfId,
        sport: 'Football',
        date: tomorrow,
        hour: 20,
        hostName: 'Host Player',
        hostPhone: '9876500222',
        playersNeeded: 2,
      });
      const matchId = createRes.match!.id;

      // Player 1 joins
      const j1 = await joinOpenMatch({ matchId, playerName: 'Joiner One', playerPhone: '9876500333' });
      expect(j1.ok).toBe(true);
      expect(j1.match?.playersJoined).toHaveLength(1);
      expect(j1.match?.status).toBe('open');

      // Player 2 joins -> reaches capacity
      const j2 = await joinOpenMatch({ matchId, playerName: 'Joiner Two', playerPhone: '9876500444' });
      expect(j2.ok).toBe(true);
      expect(j2.match?.playersJoined).toHaveLength(2);
      expect(j2.match?.status).toBe('full');

      // Player 3 tries to join full match
      const j3 = await joinOpenMatch({ matchId, playerName: 'Late Joiner', playerPhone: '9876500555' });
      expect(j3.ok).toBe(false);
      expect(j3.error).toContain('no longer open');
    });

    test('duplicate join by same phone is rejected', async () => {
      const createRes = await createOpenMatch({
        turfId,
        sport: 'Football',
        date: tomorrow,
        hour: 17,
        hostName: 'Host Player',
        hostPhone: '9876500222',
        playersNeeded: 4,
      });
      const matchId = createRes.match!.id;

      await joinOpenMatch({ matchId, playerName: 'Player A', playerPhone: '9876500666' });
      const dup = await joinOpenMatch({ matchId, playerName: 'Player A', playerPhone: '9876500666' });

      expect(dup.ok).toBe(false);
      expect(dup.error).toContain('already joined');
    });
  });

  describe('Tournaments (P13-02)', () => {
    test('seeds and retrieves tournaments', async () => {
      const list = await getTournaments();
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list[0].title).toBeTruthy();
      expect(list[0].entryFee).toBeGreaterThan(0);
    });

    test('registers a team for an upcoming tournament', async () => {
      const list = await getTournaments();
      const tourId = list[0].id;

      const res = await registerTournamentTeam({
        tournamentId: tourId,
        teamName: 'Kodialbail Strikers',
        captainName: 'Captain Vikram',
        captainPhone: '9876500777',
      });

      expect(res.ok).toBe(true);
      expect(res.tournament?.registeredTeams).toHaveLength(1);
      expect(res.team?.teamName).toBe('Kodialbail Strikers');

      // Duplicate registration rejected
      const dup = await registerTournamentTeam({
        tournamentId: tourId,
        teamName: 'Kodialbail Strikers',
        captainName: 'Someone Else',
        captainPhone: '9876500888',
      });
      expect(dup.ok).toBe(false);
      expect(dup.error).toContain('already registered');
    });
  });
});
