'use client';

import { useState } from 'react';
import { calculateSplit, generateSplitShareMessage, generateUpiLink, isValidUpiId } from '@/modules/web/lib/split-payment';

interface SplitPaymentProps {
  turfName: string;
  dateStr: string;
  timeSlot: string;
  totalAmount: number;
  customerName: string;
}

const UPI_STORAGE_KEY = 'oyun_player_upi';

export default function SplitPayment({
  turfName,
  dateStr,
  timeSlot,
  totalAmount,
  customerName,
}: SplitPaymentProps) {
  const [open, setOpen] = useState(false);
  const [playerCount, setPlayerCount] = useState(6);
  const [upiId, setUpiId] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(UPI_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [copied, setCopied] = useState(false);

  const handleUpiChange = (val: string) => {
    const clean = val.trim();
    setUpiId(clean);
    if (isValidUpiId(clean)) {
      try {
        localStorage.setItem(UPI_STORAGE_KEY, clean);
      } catch {}
    }
  };

  const split = calculateSplit(totalAmount, playerCount);

  const upiLink = isValidUpiId(upiId)
    ? generateUpiLink({
        upiId,
        payeeName: customerName,
        amount: split.perPerson,
        note: `Share for ${turfName} game`,
      })
    : undefined;

  const shareText = generateSplitShareMessage({
    turfName,
    date: dateStr,
    timeSlot,
    totalAmount,
    playerCount: split.playerCount,
    perPerson: split.perPerson,
    upiLink,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div style={{ marginTop: 12 }}>
      {!open ? (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => setOpen(true)}
          style={{ width: '100%' }}
        >
          👥 Split cost with team
        </button>
      ) : (
        <div
          style={{
            background: 'var(--bg-card, #f8f9fa)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 16,
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Split Payment with Teammates</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: 18, minWidth: 44, minHeight: 44, cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Number of players:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setPlayerCount((c) => Math.max(2, c - 1))}
                style={{ padding: '2px 10px', fontSize: 16 }}
              >
                −
              </button>
              <span style={{ fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                {playerCount}
              </span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setPlayerCount((c) => Math.min(30, c + 1))}
                style={{ padding: '2px 10px', fontSize: 16 }}
              >
                +
              </button>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 14px',
              textAlign: 'center',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Each player owes
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-primary, #9e0a0a)', marginTop: 2 }}>
              ₹{split.perPerson}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Total: ₹{totalAmount} ÷ {split.playerCount}
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 13, marginBottom: 12 }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Your UPI ID (to generate payment link)
            </span>
            <input
              type="text"
              value={upiId}
              onChange={(e) => handleUpiChange(e.target.value)}
              placeholder="e.g. 9876543210@upi or name@okaxis"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${upiId && !isValidUpiId(upiId) ? '#b00020' : 'var(--border)'}`,
                background: 'var(--bg-card)',
                fontSize: 14,
              }}
            />
            {upiId && !isValidUpiId(upiId) && (
              <span style={{ color: 'var(--err)', fontSize: 11, marginTop: 4, display: 'block' }}>
                Please enter a valid UPI VPA (e.g. mobile@upi)
              </span>
            )}
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <a
              className="btn btn--primary btn--sm"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
            >
              💬 Send to WhatsApp
            </a>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleCopy}
            >
              {copied ? '✓ Copied' : '📋 Copy message'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
