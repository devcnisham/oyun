'use client';

import { useState } from 'react';
import type { Tournament } from '@/lib/types';
import { registerTournamentTeam } from '@/lib/tournaments';

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
              background: '#ffffff',
              border: '1px solid #e5e7eb',
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
                    background: '#fef3c7',
                    color: '#92400e',
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

              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px', color: '#111827' }}>
                {t.title}
              </h2>

              <p style={{ margin: '0 0 16px', color: '#4b5563', fontSize: '14px' }}>
                📍 <strong>{t.turfName}</strong>
              </p>

              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#6b7280' }}>Dates:</span>
                  <span style={{ fontWeight: 600 }}>{t.startDate} – {t.endDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#6b7280' }}>Format:</span>
                  <span style={{ fontWeight: 600 }}>{t.format}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#6b7280' }}>Entry Fee:</span>
                  <span style={{ fontWeight: 600 }}>₹{t.entryFee} / team</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Prize Pool:</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>{t.prizePool}</span>
                </div>
              </div>

              {t.registeredTeams.length > 0 && (
                <div style={{ marginBottom: '16px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 'bold', color: '#374151' }}>Registered Teams ({t.registeredTeams.length}): </span>
                  <span style={{ color: '#6b7280' }}>{t.registeredTeams.map((r) => r.teamName).join(', ')}</span>
                </div>
              )}

              {feedback && feedback.id === t.id && (
                <p style={{ color: feedback.ok ? '#047857' : '#b91c1c', fontSize: '13px', margin: '0 0 12px' }}>
                  {feedback.text}
                </p>
              )}
            </div>

            {registeringId === t.id ? (
              <form onSubmit={(e) => handleRegister(e, t.id)} style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '8px', fontSize: '13px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Captain name"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '8px', fontSize: '13px' }}
                  required
                />
                <input
                  type="tel"
                  placeholder="Captain 10-digit mobile"
                  value={captainPhone}
                  onChange={(e) => setCaptainPhone(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '8px', fontSize: '13px' }}
                  required
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '8px',
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
                      borderRadius: '6px',
                      background: '#e5e7eb',
                      color: '#374151',
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
                  borderRadius: '8px',
                  backgroundColor: isFull ? '#e5e7eb' : '#059669',
                  color: isFull ? '#9ca3af' : '#ffffff',
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
