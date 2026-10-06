'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  checkReferralCode,
  createBookings,
  getSlotsForDate,
  holdSlots,
  quoteSelection,
  releaseHolds,
  type ReferralCheck,
  type SelectionQuote,
} from '@/lib/booking-actions';
import { addMyBookingIds, getProfile, saveProfile } from '@/lib/client/device';
import { useAccount, useOpenClerkSignIn } from '@/lib/client/use-account';
import { useSlotUpdates } from '@/lib/client/use-slot-updates';
import { clerkEnabled } from '@/lib/clerk';
import SignInGate from '@/components/SignInGate';
import type { Slot, Turf } from '@/lib/types';
import styles from './BookingFlow.module.css';

export interface BookingFlowProps {
  turf: Turf;
  dates: { date: string; label: string; day: string; num: string }[];
  initialDate: string;
  initialSlots: Slot[];
  rewards: { cashbackEnabled: boolean; cashbackPercent: number; cashbackMax: number; referralEnabled: boolean; refereeReward: number };
  initialReferral: string;
}

const MAX_SLOTS = 6;

const SESSIONS = [
  { name: 'Morning', icon: '🌅', from: 0, to: 12 },
  { name: 'Afternoon', icon: '☀️', from: 12, to: 17 },
  { name: 'Evening', icon: '🌆', from: 17, to: 21 },
  { name: 'Night', icon: '🌙', from: 21, to: 24 },
];

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const shortHour = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;

// "7 PM – 9 PM" for consecutive hours, "7 PM, 9 PM" otherwise
function describeHours(hours: number[]) {
  if (hours.length === 0) return '';
  const sorted = [...hours].sort((a, b) => a - b);
  const consecutive = sorted.every((h, i) => i === 0 || h === sorted[i - 1] + 1);
  if (consecutive) return `${shortHour(sorted[0])} – ${shortHour(sorted[sorted.length - 1] + 1)}`;
  return sorted.map(shortHour).join(', ');
}

function slotTitle(slot: Slot) {
  if (slot.available) return `${slot.label} · ${rupees(slot.price)}`;
  return `${slot.label} · ${slot.reason === 'held' ? 'Someone is booking this slot' : slot.reason === 'past' ? 'Over' : 'Not available'}`;
}

export default function BookingFlow({ turf, dates, initialDate, initialSlots, rewards, initialReferral }: BookingFlowProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selected, setSelected] = useState<number[]>([]);
  const [loadingSlots, startSlotLoad] = useTransition();
  const [toast, setToast] = useState('');

  // Checkout state
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(initialReferral);
  const [promo, setPromo] = useState<string | null>(null);
  const [referral, setReferral] = useState<ReferralCheck | null>(null);
  const [codeError, setCodeError] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [quote, setQuote] = useState<SelectionQuote | null>(null);
  const [error, setError] = useState('');
  const [paying, startPaying] = useTransition();
  const [showGate, setShowGate] = useState(false);
  const account = useAccount();
  const openClerkSignIn = useOpenClerkSignIn();

  const inCheckout = holdUntil !== null;
  const secondsLeft = holdUntil ? Math.max(0, Math.ceil((holdUntil - now) / 1000)) : 0;
  const phoneDigits = phone.replace(/\D/g, '').slice(-10);
  const selectedSlots = slots.filter((s) => selected.includes(s.hour));
  const estimate = selectedSlots.reduce((sum, s) => sum + s.price, 0);
  const dateInfo = dates.find((d) => d.date === date);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((t) => (t === message ? '' : t)), 3200);
  }, []);

  // Fill in the signed-in player's name and number
  useEffect(() => {
    if (!account.ready) return;
    const p = getProfile();
    queueMicrotask(() => {
      setName((n) => n || account.name || p.name);
      setPhone((n) => n || account.phone || p.phone);
    });
  }, [account.ready, account.name, account.phone]);

  // Keep the slot map live, like a cinema seat map
  const refreshSlots = useCallback(
    async (forDate: string) => {
      const fresh = await getSlotsForDate(turf.id, forDate);
      setSlots(fresh);
      setSelected((prev) => {
        const still = prev.filter((h) => fresh.find((s) => s.hour === h)?.available);
        if (still.length < prev.length) flash('A slot you picked was just taken');
        return still;
      });
    },
    [turf.id, flash]
  );

  // Live seat map: other players' holds and bookings show up within a second
  const refreshCurrent = useCallback(() => {
    refreshSlots(date).catch(() => {});
  }, [date, refreshSlots]);
  useSlotUpdates(turf.id, date, refreshCurrent, !inCheckout);

  // Countdown while slots are held
  useEffect(() => {
    if (!inCheckout) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [inCheckout]);

  const closeCheckout = useCallback(
    (message?: string) => {
      setHoldUntil(null);
      setQuote(null);
      setError('');
      releaseHolds().catch(() => {});
      startSlotLoad(() => refreshSlots(date));
      if (message) flash(message);
    },
    [date, refreshSlots, flash]
  );

  useEffect(() => {
    if (inCheckout && secondsLeft === 0 && !paying) {
      queueMicrotask(() => closeCheckout('Your hold expired and the slots were released'));
    }
  }, [inCheckout, secondsLeft, paying, closeCheckout]);

  // Server prices the exact booking whenever checkout inputs change
  useEffect(() => {
    if (!inCheckout) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const result = await quoteSelection({
        turfId: turf.id,
        date,
        hours: selected,
        promoCode: promo,
        addOns: [],
        useWallet,
        phone: phoneDigits,
      });
      if (cancelled) return;
      if ('error' in result) setError(result.error);
      else setQuote(result);
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [inCheckout, turf.id, date, selected, promo, useWallet, phoneDigits]);

  const changeDate = (next: string) => {
    if (next === date) return;
    setDate(next);
    setSelected([]);
    startSlotLoad(async () => {
      setSlots(await getSlotsForDate(turf.id, next));
    });
  };

  const toggleSlot = (slot: Slot) => {
    if (!slot.available) {
      if (slot.reason === 'held') flash('Someone is booking this slot right now. Check back in a few minutes.');
      return;
    }
    setSelected((prev) => {
      if (prev.includes(slot.hour)) return prev.filter((h) => h !== slot.hour);
      if (prev.length >= MAX_SLOTS) {
        flash(`You can book up to ${MAX_SLOTS} slots at a time`);
        return prev;
      }
      return [...prev, slot.hour].sort((a, b) => a - b);
    });
  };

  const proceed = async () => {
    if (selected.length === 0 || holding) return;
    setHolding(true);
    try {
      const result = await holdSlots(turf.id, date, selected);
      setSlots(result.slots);
      if (!result.ok) {
        setSelected((prev) => prev.filter((h) => result.slots.find((s) => s.hour === h)?.available));
        flash(result.error);
        return;
      }
      setError('');
      setNow(Date.now());
      setHoldUntil(Date.now() + result.expiresInMs);
    } finally {
      setHolding(false);
    }
  };

  const applyCode = async () => {
    if (promo || referral?.status === 'valid') {
      setPromo(null);
      setReferral(null);
      setCode('');
      setCodeError('');
      return;
    }
    const entered = code.trim().toUpperCase();
    if (!entered) return;
    const tryPromo = await quoteSelection({ turfId: turf.id, date, hours: selected, promoCode: entered, addOns: [], useWallet, phone: phoneDigits });
    if (!('error' in tryPromo) && tryPromo.promoCode && !tryPromo.promoError) {
      setPromo(tryPromo.promoCode);
      setCodeError('');
      return;
    }
    if (rewards.referralEnabled) {
      const check = await checkReferralCode(entered, phoneDigits);
      if (check.status === 'valid') {
        setReferral(check);
        setCodeError('');
        return;
      }
      if (check.status === 'not_new') {
        setCodeError("Referral codes are for a player's first booking only.");
        return;
      }
    }
    setCodeError(('error' in tryPromo ? null : tryPromo.promoError) ?? 'Invalid promo or referral code');
  };

  const pay = () => {
    setError('');
    // Booking needs an account: sign in or sign up first, without losing the held slots
    if (!account.signedIn) {
      if (clerkEnabled) openClerkSignIn();
      else setShowGate(true);
      return;
    }
    reserve(name, phoneDigits);
  };

  // Confirms the held slots; the player pays the turf at the venue
  const reserve = (playerName: string, playerPhone: string) => {
    if (!playerName.trim()) return setError('Enter your name');
    if (playerPhone.length !== 10) return setError('Enter a 10-digit mobile number');
    if (!quote) return;
    startPaying(async () => {
      const result = await createBookings({
        turfId: turf.id,
        date,
        hours: selected,
        promoCode: promo,
        addOns: [],
        useWallet,
        phone: playerPhone,
        name: playerName,
        referralCode: rewards.referralEnabled && referral?.status === 'valid' ? code : null,
      });
      if (!result.ids) {
        setError(result.error ?? 'Could not complete the booking');
        return;
      }
      saveProfile({ name: playerName.trim(), phone: playerPhone });
      addMyBookingIds(result.ids);
      router.push(result.ids.length === 1 ? `/bookings/${result.ids[0]}` : `/bookings?new=${result.ids.join(',')}`);
    });
  };

  const cashback = rewards.cashbackEnabled && quote ? Math.min(rewards.cashbackMax, Math.floor((quote.total * rewards.cashbackPercent) / 100)) : 0;
  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className={styles.flow}>
      {/* 1 · Date strip */}
      <div className={styles.stepHead}>
        <h3>Select date</h3>
      </div>
      <div className={styles.dates} role="tablist" aria-label="Date">
        {dates.map((d) => (
          <button
            key={d.date}
            role="tab"
            aria-selected={d.date === date}
            className={`${styles.date} ${d.date === date ? styles.dateOn : ''}`}
            onClick={() => changeDate(d.date)}
          >
            <small>{d.day}</small>
            <b>{d.num}</b>
          </button>
        ))}
      </div>

      {/* 2 · Slot map */}
      <div className={styles.stepHead}>
        <h3>Pick your slots</h3>
        <span className={styles.muted}>{loadingSlots ? 'Updating…' : `${availableCount} open`}</span>
      </div>

      <div className={styles.pitch} aria-hidden>
        <span>⚽ {turf.size} pitch · {dateInfo?.label}</span>
      </div>

      <div className={`${styles.map} ${loadingSlots ? styles.mapLoading : ''}`}>
        {slots.length === 0 && <p className={styles.muted}>No slots on this day.</p>}
        {SESSIONS.map((session) => {
          const inSession = slots.filter((s) => s.hour >= session.from && s.hour < session.to);
          if (inSession.length === 0) return null;
          return (
            <div key={session.name} className={styles.session}>
              <div className={styles.sessionName}>
                <span>{session.icon}</span> {session.name}
              </div>
              <div className={styles.grid}>
                {inSession.map((slot) => {
                  const isOn = selected.includes(slot.hour);
                  const state = isOn ? styles.on : slot.available ? styles.open : slot.reason === 'held' ? styles.held : slot.reason === 'past' ? styles.past : styles.taken;
                  const deal = slot.tags.find((t) => t.includes('-'));
                  return (
                    <button
                      key={slot.hour}
                      className={`${styles.seat} ${state}`}
                      onClick={() => toggleSlot(slot)}
                      aria-pressed={isOn}
                      aria-disabled={!slot.available}
                      title={slotTitle(slot)}
                    >
                      {deal && slot.available && <span className={styles.deal}>{deal.match(/-\d+%/)?.[0] ?? 'Deal'}</span>}
                      {slot.tags.includes('Peak') && slot.available && <span className={styles.peak} title="Peak hours" />}
                      <span className={styles.seatTime}>{shortHour(slot.hour)}</span>
                      <span className={styles.seatSub}>
                        {slot.available ? rupees(slot.price) : slot.reason === 'held' ? 'On hold' : slot.reason === 'past' ? 'Over' : 'Booked'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span><i className={styles.open} /> Available</span>
        <span><i className={styles.on} /> Selected</span>
        <span><i className={styles.held} /> On hold</span>
        <span><i className={styles.taken} /> Booked</span>
      </div>

      {/* Sticky selection bar */}
      <div className={`${styles.bar} ${selected.length > 0 && !inCheckout ? styles.barShow : ''}`}>
        <div className={styles.barInfo}>
          <b>{selected.length} slot{selected.length === 1 ? '' : 's'} · {rupees(estimate)}</b>
          <span>{dateInfo?.label} · {describeHours(selected)}</span>
        </div>
        <button className={styles.primary} onClick={proceed} disabled={holding || selected.length === 0}>
          {holding ? 'Holding…' : 'Proceed'}
        </button>
      </div>
      <div className={styles.barSpacer} />

      {toast && createPortal(<div className={`${styles.flow} ${styles.toast}`} role="status">{toast}</div>, document.body)}

      {/* 3 · Checkout sheet */}
      {inCheckout && createPortal(
        <div className={`${styles.flow} ${styles.overlay}`} onClick={(e) => e.target === e.currentTarget && !paying && closeCheckout()}>
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Checkout">
            <div className={styles.sheetHead}>
              <button className={styles.back} onClick={() => closeCheckout()} disabled={paying} aria-label="Back to slots">←</button>
              <h2>Checkout</h2>
              <span className={`${styles.timer} ${secondsLeft < 60 ? styles.timerLow : ''}`} aria-live="polite">
                ⏱ {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
            </div>

            <div className={styles.sheetBody}>
              <div className={styles.ticket}>
                <div>
                  <b>{turf.name}</b>
                  <span className={styles.muted}>{turf.area} · {turf.size}</span>
                </div>
                <div className={styles.ticketRow}>
                  <span>{dateInfo?.label}</span>
                  <b>{describeHours(selected)}</b>
                </div>
                <div className={styles.chips}>
                  {(quote?.slots ?? selectedSlots.map((s) => ({ hour: s.hour, label: s.label, price: s.price }))).map((s) => (
                    <span key={s.hour} className={styles.chip}>{shortHour(s.hour)} · {rupees(s.price)}</span>
                  ))}
                </div>
                <p className={styles.holdNote}>🔒 These slots are reserved for you until the timer runs out.</p>
              </div>

              <section>
                <h3>Your details</h3>
                <div className={styles.fields}>
                  <input className={styles.input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  <input className={styles.input} placeholder="10-digit mobile number" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                </div>
              </section>

              <section>
                <h3>Offers</h3>
                <div className={styles.codeRow}>
                  <input
                    className={styles.input}
                    placeholder="Promo or referral code"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(''); }}
                    disabled={promo !== null || referral?.status === 'valid'}
                  />
                  <button className={styles.secondary} onClick={applyCode}>{promo || referral?.status === 'valid' ? 'Remove' : 'Apply'}</button>
                </div>
                {codeError && <p className={styles.error}>{codeError}</p>}
                {promo && <p className={styles.success}>Code {promo} applied</p>}
                {referral?.status === 'valid' && (
                  <p className={styles.success}>Code from {referral.referrerName} applied: you get {rupees(referral.reward)} in your wallet after your first game.</p>
                )}
                {(quote?.walletBalance ?? 0) > 0 && (
                  <label className={styles.toggle}>
                    <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} />
                    <span>Use wallet balance ({rupees(quote!.walletBalance)})</span>
                  </label>
                )}
              </section>

              <section className={styles.venueNote}>
                <h3>Payment</h3>
                <p>💵 Pay at the turf when you arrive, by cash or UPI. Your slots are confirmed as soon as you reserve.</p>
              </section>

              {quote && (
                <section className={styles.bill}>
                  <div><span>Slots ({quote.slots.length})</span><span>{rupees(quote.slotTotal)}</span></div>
                  {quote.adjustments.map((a) => (
                    <div key={a.label} className={styles.discount}><span>{a.label}</span><span>−{rupees(-a.amount)}</span></div>
                  ))}
                  {quote.walletDeduction > 0 && <div className={styles.discount}><span>Wallet</span><span>−{rupees(quote.walletDeduction)}</span></div>}
                  <div className={styles.billTotal}><span>Pay at venue (incl. GST)</span><span>{rupees(quote.total)}</span></div>
                  {cashback > 0 && <p className={styles.success}>💰 Earn {rupees(cashback)} cashback when you check in</p>}
                </section>
              )}

              {error && <p className={styles.error} role="alert">{error}</p>}
            </div>

            <div className={styles.sheetFoot}>
              <div className={styles.barInfo}>
                <b>{quote ? rupees(quote.total) : '…'}</b>
                <span>Pay at venue</span>
              </div>
              <button className={styles.primary} onClick={pay} disabled={!quote || paying}>
                {paying ? 'Reserving…' : account.signedIn ? 'Reserve slot' : 'Sign in to reserve'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showGate &&
        createPortal(
          <SignInGate
            onClose={() => setShowGate(false)}
            onDone={() => {
              const p = getProfile();
              setShowGate(false);
              setName(p.name);
              setPhone(p.phone);
              setError('');
              reserve(p.name, p.phone);
            }}
          />,
          document.body
        )}

    </div>
  );
}

