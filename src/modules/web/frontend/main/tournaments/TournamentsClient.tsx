'use client';

import { useState } from 'react';
import type { Tournament } from '@/modules/shared/database/types';
import { registerTournamentTeam } from '@/modules/web/lib/tournaments';

export default function TournamentsClient({
  tournaments: initialTournaments,
}: {
  tournaments: Tournament[];
}) {
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  async function handleRegister(e: React.FormEvent, tourId: string) {
    e.preventDefault();
    setFeedback(null);

    const res = await registerTournamentTeam({
      tournamentId: tourId,
      teamName,
      captainName,
      captainPhone,
    });

    if (res.ok && res.tournament) {
      setTournaments((prev) => prev.map((t) => (t.id === tourId ? res.tournament! : t)));
      setFeedback({ id: tourId, ok: true, text: 'Team registered successfully! Organizer will contact captain.' });
      setTeamName('');
      setCaptainName('');
      setCaptainPhone('');
      setRegisteringId(null);
    } else {
      setFeedback({ id: tourId, ok: false, text: res.error || 'Failed to register team' });
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
      {tournaments.map((t) => {
        const spotsLeft = t.maxTeams - t.registeredTeams.length;
        const isFull = t.status !== 'upcoming' || spotsLeft <= 0;

        return (
          <div
            key={t.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'var(--warn-bg)',
                    color: 'var(--warn)',
                    textTransform: 'uppercase',
                  }}
                >
                  🏆 {t.sport}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: isFull ? '#fee2e2' : '#d1fae5',
                    color: isFull ? '#991b1b' : '#065f46',
                  }}
                >
                  {isFull ? 'Registration Full' : `${spotsLeft} of ${t.maxTeams} spots left`}
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px', color: 'var(--text-primary)' }}>
                {t.title}
              </h2>

              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                📍 <strong>{t.turfName}</strong>
              </p>

              <div style={{ background: 'var(--bg-muted)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Dates:</span>
                  <span style={{ fontWeight: 600 }}>{t.startDate} – {t.endDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Format:</span>
                  <span style={{ fontWeight: 600 }}>{t.format}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Entry Fee:</span>
                  <span style={{ fontWeight: 600 }}>₹{t.entryFee} / team</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Prize Pool:</span>
                  <span style={{ fontWeight: 700, color: 'var(--ok)' }}>{t.prizePool}</span>
                </div>
              </div>

              {t.registeredTeams.length > 0 && (
                <div style={{ marginBottom: '16px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Registered Teams ({t.registeredTeams.length}): </span>
                  <span style={{ color: 'var(--text-muted)' }}>{t.registeredTeams.map((r) => r.teamName).join(', ')}</span>
                </div>
              )}

              {feedback && feedback.id === t.id && (
                <p style={{ color: feedback.ok ? '#047857' : '#b91c1c', fontSize: '13px', margin: '0 0 12px' }}>
                  {feedback.text}
                </p>
              )}
            </div>

            {registeringId === t.id ? (
              <form onSubmit={(e) => handleRegister(e, t.id)} style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Team name"
                  aria-label="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', minHeight: 44, borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px', fontSize: '16px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Captain name"
                  aria-label="Captain name"
                  autoComplete="name"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', minHeight: 44, borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px', fontSize: '16px' }}
                  required
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  aria-label="Captain 10-digit mobile number"
                  placeholder="Captain 10-digit mobile"
                  value={captainPhone}
                  onChange={(e) => setCaptainPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', minHeight: 44, borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px', fontSize: '16px' }}
                  required
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '8px', minHeight: 44,
                      borderRadius: '6px',
                      background: '#047857',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Submit Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisteringId(null)}
                    style={{
                      padding: '8px 12px',
                      minHeight: 44,
                      borderRadius: '6px',
                      background: 'var(--bg-muted)',
                      color: 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                disabled={isFull}
                onClick={() => {
                  setRegisteringId(t.id);
                  setFeedback(null);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  minHeight: 44,
                  borderRadius: '8px',
                  backgroundColor: isFull ? '#e5e7eb' : '#047857',
                  color: isFull ? '#4b5563' : '#ffffff',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: isFull ? 'not-allowed' : 'pointer',
                }}
              >
                {isFull ? 'Registration Closed' : 'Register Team'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
