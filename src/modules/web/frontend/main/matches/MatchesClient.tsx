'use client';

import { useState } from 'react';
import type { OpenMatch, PublicTurf } from '@/modules/shared/database/types';
import { createOpenMatch, joinOpenMatch } from '@/modules/web/backend/community';

export default function MatchesClient({
  initialMatches,
  turfs,
}: {
  initialMatches: OpenMatch[];
  turfs: PublicTurf[];
}) {
  const [matches, setMatches] = useState<OpenMatch[]>(initialMatches);
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [joinMsg, setJoinMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  // Host match modal / drawer state
  const [showHostForm, setShowHostForm] = useState(false);
  const [hostTurfId, setHostTurfId] = useState(turfs[0]?.id ?? '');
  const [hostSport, setHostSport] = useState(turfs[0]?.sports[0] ?? 'Football');
  const [hostDate, setHostDate] = useState('');
  const [hostHour, setHostHour] = useState(19);
  const [hostFormat, setHostFormat] = useState('5-a-side');
  const [hostName, setHostName] = useState('');
  const [hostPhone, setHostPhone] = useState('');
  const [hostPlayersNeeded, setHostPlayersNeeded] = useState(2);
  const [hostError, setHostError] = useState('');
  const [hostSuccess, setHostSuccess] = useState('');

  const sports = ['All', 'Football', 'Box Cricket', 'Badminton'];

  const filtered = sportFilter === 'All' ? matches : matches.filter((m) => m.sport.toLowerCase() === sportFilter.toLowerCase());

  async function handleJoin(e: React.FormEvent, matchId: string) {
    e.preventDefault();
    setJoinMsg(null);

    const res = await joinOpenMatch({
      matchId,
      playerName,
      playerPhone,
    });

    if (res.ok && res.match) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? res.match! : m)));
      setJoinMsg({ id: matchId, ok: true, text: 'Joined successfully! See you on the pitch.' });
      setPlayerName('');
      setPlayerPhone('');
      setJoiningId(null);
    } else {
      setJoinMsg({ id: matchId, ok: false, text: res.error || 'Failed to join match' });
    }
  }

  async function handleHost(e: React.FormEvent) {
    e.preventDefault();
    setHostError('');
    setHostSuccess('');

    const res = await createOpenMatch({
      turfId: hostTurfId,
      sport: hostSport,
      date: hostDate,
      hour: Number(hostHour),
      format: hostFormat,
      hostName,
      hostPhone,
      playersNeeded: Number(hostPlayersNeeded),
    });

    if (res.ok && res.match) {
      setMatches((prev) => [res.match!, ...prev]);
      setHostSuccess('Match posted! Players can now join your game.');
      setTimeout(() => setShowHostForm(false), 1500);
    } else {
      setHostError(res.error || 'Failed to create match');
    }
  }

  return (
    <div>
      {/* Controls & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {sports.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSportFilter(s)}
              style={{
                padding: '8px 16px',
                minHeight: 44,
                borderRadius: '999px',
                border: '1px solid var(--border)',
                backgroundColor: sportFilter === s ? '#047857' : '#ffffff',
                color: sportFilter === s ? '#ffffff' : '#374151',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setShowHostForm(!showHostForm);
            setHostError('');
            setHostSuccess('');
          }}
          style={{
            padding: '10px 20px',
            minHeight: 44,
            borderRadius: '8px',
            backgroundColor: '#047857',
            color: '#ffffff',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {showHostForm ? 'Close Form' : '+ Host an Open Match'}
        </button>
      </div>

      {/* Host Match Form */}
      {showHostForm && (
        <form
          onSubmit={handleHost}
          style={{
            background: 'var(--bg-muted)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold' }}>Post a Match Looking for Players</h3>

          {hostError && <p style={{ color: 'var(--err)', marginBottom: '12px' }}>{hostError}</p>}
          {hostSuccess && <p style={{ color: 'var(--ok)', marginBottom: '12px' }}>{hostSuccess}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="host-turf" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Turf / Venue</label>
              <select
                id="host-turf"
                value={hostTurfId}
                onChange={(e) => {
                  setHostTurfId(e.target.value);
                  const selectedTurf = turfs.find((t) => t.id === e.target.value);
                  if (selectedTurf) setHostSport(selectedTurf.sports[0] ?? 'Football');
                }}
                style={{ width: '100%', padding: '10px 12px', minHeight: 44, fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                {turfs.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.area})</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="host-sport" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Sport</label>
              <input
                id="host-sport"
                type="text"
                value={hostSport}
                onChange={(e) => setHostSport(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', minHeight: 44, fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border)' }}
                placeholder="Football, Box Cricket..."
                required
              />
            </div>

            <div>
              <label htmlFor="host-format" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Format</label>
              <input
                id="host-format"
                type="text"
                value={hostFormat}
                onChange={(e) => setHostFormat(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', minHeight: 44, fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border)' }}
                placeholder="5-a-side, 7-a-side..."
              />
            </div>

            <div>
              <label htmlFor="host-date" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Date</label>
              <input
                id="host-date"
                type="date"
                value={hostDate}
                onChange={(e) => setHostDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', minHeight: 44, fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border)' }}
                required
              />
            </div>

            <div>
              <label htmlFor="host-hour" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Hour (0-23)</label>
              <select
                id="host-hour"
                value={hostHour}
                onChange={(e) => setHostHour(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', minHeight: 44, fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={h}>{h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="host-players" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Players Needed</label>
              <input
                id="host-players"
                type="number"
                min="1"
                max="20"
                value={hostPlayersNeeded}
                onChange={(e) => setHostPlayersNeeded(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', minHeight: 44, fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border)' }}
                required
              />
            </div>

            <div>
              <label htmlFor="host-name" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Your Name (Host)</label>
              <input
                id="host-name"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', minHeight: 44, fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border)' }}
                placeholder="Rohan"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="host-phone" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Your 10-digit Phone</label>
              <input
                id="host-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={hostPhone}
                onChange={(e) => setHostPhone(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', minHeight: 44, fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border)' }}
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              minHeight: 44,
              borderRadius: '8px',
              backgroundColor: '#047857',
              color: '#ffffff',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Publish Match
          </button>
        </form>
      )}

      {/* Match Listings */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--bg-muted)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', margin: '0 0 12px' }}>No open matches found for {sportFilter}.</p>
          <button
            type="button"
            onClick={() => setShowHostForm(true)}
            style={{
              padding: '8px 16px',
              minHeight: 44,
              borderRadius: '6px',
              backgroundColor: '#047857',
              color: '#ffffff',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Host the First Game
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map((m) => {
            const slotsLeft = m.playersNeeded - m.playersJoined.length;
            const isFull = m.status === 'full' || slotsLeft <= 0;

            return (
              <div
                key={m.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'var(--info-bg)',
                        color: 'var(--info)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {m.sport} · {m.format}
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
                      {isFull ? 'Full' : `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} left`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '8px 0 4px', color: 'var(--text-primary)' }}>
                    {m.turfName}
                  </h3>
                  <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    📅 {m.date} at {m.timeLabel}
                  </p>
                  <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Organized by <strong>{m.hostName}</strong>
                  </p>

                  {m.playersJoined.length > 0 && (
                    <div style={{ background: 'var(--bg-muted)', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Joined ({m.playersJoined.length}): </span>
                      <span style={{ color: 'var(--text-muted)' }}>{m.playersJoined.map((p) => p.name).join(', ')}</span>
                    </div>
                  )}

                  {joinMsg && joinMsg.id === m.id && (
                    <p style={{ color: joinMsg.ok ? '#047857' : '#b91c1c', fontSize: '13px', margin: '0 0 12px' }}>
                      {joinMsg.text}
                    </p>
                  )}
                </div>

                {joiningId === m.id ? (
                  <form onSubmit={(e) => handleJoin(e, m.id)} style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <input
                      type="text"
                      placeholder="Your name"
                      aria-label="Your name"
                      autoComplete="name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', minHeight: 44, borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px', fontSize: '16px' }}
                      required
                    />
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      aria-label="10-digit mobile number"
                      placeholder="10-digit mobile"
                      value={playerPhone}
                      onChange={(e) => setPlayerPhone(e.target.value)}
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
                        Confirm Join
                      </button>
                      <button
                        type="button"
                        onClick={() => setJoiningId(null)}
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
                      setJoiningId(m.id);
                      setJoinMsg(null);
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
                    {isFull ? 'Match Full' : 'Join Match'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
