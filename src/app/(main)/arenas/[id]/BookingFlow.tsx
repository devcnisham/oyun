'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createBookings, getSlotsForDate, holdSlots, releaseHolds } from '@/lib/booking-actions';
import { addMyBookingIds, getProfile, saveProfile } from '@/lib/client/device';
import { useAccount, useOpenClerkSignIn } from '@/lib/client/use-account';
import { useSlotUpdates } from '@/lib/client/use-slot-updates';
import { clerkEnabled } from '@/lib/clerk';
import dynamic from 'next/dynamic';
import { primarySport } from '@/lib/sports';
import type { PitchSize, PublicTurf, Slot } from '@/lib/types';
import { MAX_SLOTS } from '@/lib/booking-types';
import { rupees } from '@/lib/format';
import { describeHours } from './booking-format';
import { useCheckoutForm } from './useCheckoutForm';
import PitchPicker from './PitchPicker';
import SlotMap from './SlotMap';
import styles from './BookingFlow.module.css';

// Only needed once the player proceeds to checkout or sign-in
const CheckoutSheet = dynamic(() => import('./CheckoutSheet'));
const SignInGate = dynamic(() => import('@/components/SignInGate'));

export interface BookingFlowProps {
  turf: PublicTurf;
  dates: { date: string; label: string; day: string; num: string }[];
  initialDate: string;
  initialSlots: Slot[];
  rewards: { cashbackEnabled: boolean; cashbackPercent: number; cashbackMax: number; referralEnabled: boolean; refereeReward: number };
  initialReferral: string;
}

export default function BookingFlow({ turf, dates, initialDate, initialSlots, rewards, initialReferral }: BookingFlowProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selected, setSelected] = useState<number[]>([]);
  const [size, setSize] = useState<PitchSize>('full'); // whole pitch or one half (turfs that split)
  const [loadingSlots, startSlotLoad] = useTransition();
  const [toast, setToast] = useState('');

  // Checkout state
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [paying, startPaying] = useTransition();
  const [showGate, setShowGate] = useState(false);
  const account = useAccount();
  const openClerkSignIn = useOpenClerkSignIn();
  const form = useCheckoutForm({
    turfId: turf.id,
    date,
    hours: selected,
    size,
    active: holdUntil !== null,
    referralEnabled: rewards.referralEnabled,
    initialCode: initialReferral,
    account,
  });

  const { reset: resetForm } = form;
  const inCheckout = holdUntil !== null;
  const secondsLeft = holdUntil ? Math.max(0, Math.ceil((holdUntil - now) / 1000)) : 0;
  const selectedSlots = slots.filter((s) => selected.includes(s.hour));
  const estimate = selectedSlots.reduce((sum, s) => sum + s.price, 0);
  const dateInfo = dates.find((d) => d.date === date);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((t) => (t === message ? '' : t)), 3200);
  }, []);

  // Keep the slot map live, like a cinema seat map
  const refreshSlots = useCallback(
    async (forDate: string) => {
      const fresh = await getSlotsForDate(turf.id, forDate, size);
      setSlots(fresh);
      setSelected((prev) => {
        const still = prev.filter((h) => fresh.find((s) => s.hour === h)?.available);
        if (still.length < prev.length) flash('A slot you picked was just taken');
        return still;
      });
    },
    [turf.id, size, flash]
  );

  // Live seat map: other players' holds and bookings show up within a second
  const refreshCurrent = useCallback(() => {
    refreshSlots(date).catch(() => {});
  }, [date, refreshSlots]);
  useSlotUpdates(turf.id, date, refreshCurrent, !inCheckout);

  // Leaving mid-checkout (closing the tab, navigating away) frees the held slots for others at once
  useEffect(() => {
    if (!inCheckout) return;
    const release = () => {
      try {
        navigator.sendBeacon('/api/holds/release');
      } catch {}
    };
    window.addEventListener('pagehide', release);
    return () => window.removeEventListener('pagehide', release);
  }, [inCheckout]);

  // Countdown while slots are held
  useEffect(() => {
    if (!inCheckout) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [inCheckout]);

  const closeCheckout = useCallback(
    (message?: string) => {
      setHoldUntil(null);
      resetForm();
      releaseHolds().catch(() => {});
      startSlotLoad(() => refreshSlots(date));
      if (message) flash(message);
    },
    [date, refreshSlots, flash, resetForm]
  );

  useEffect(() => {
    if (inCheckout && secondsLeft === 0 && !paying) {
      queueMicrotask(() => closeCheckout('Your hold expired and the slots were released'));
    }
  }, [inCheckout, secondsLeft, paying, closeCheckout]);

  // New date or size: a different price and availability, so start the pick again
  const reloadSlots = (nextDate: string, nextSize: PitchSize) => {
    setSelected([]);
    startSlotLoad(async () => {
      setSlots(await getSlotsForDate(turf.id, nextDate, nextSize));
    });
  };

  const changeDate = (next: string) => {
    if (next === date) return;
    setDate(next);
    reloadSlots(next, size);
  };

  // Full pitch or half
  const changeSize = (next: PitchSize) => {
    if (next === size) return;
    setSize(next);
    reloadSlots(date, next);
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
      const result = await holdSlots(turf.id, date, selected, size);
      setSlots(result.slots);
      if (!result.ok) {
        setSelected((prev) => prev.filter((h) => result.slots.find((s) => s.hour === h)?.available));
        flash(result.error);
        return;
      }
      form.setError('');
      const t = Date.now();
      setNow(t);
      setHoldUntil(t + result.expiresInMs);
    } finally {
      setHolding(false);
    }
  };

  const pay = () => {
    form.setError('');
    // Booking needs an account: sign in or sign up first, without losing the held slots
    if (!account.signedIn) {
      if (clerkEnabled) openClerkSignIn();
      else setShowGate(true);
      return;
    }
    reserve(form.name, form.phoneDigits);
  };

  // Confirms the held slots; nothing is charged online, the player pays the turf at the venue
  const reserve = (playerName: string, playerPhone: string) => {
    if (!playerName.trim()) return form.setError('Enter your name');
    if (playerPhone.length !== 10) return form.setError('Enter a 10-digit mobile number');
    if (!form.quote) return;
    startPaying(async () => {
      const result = await createBookings({
        ...form.base,
        promoCode: form.promo,
        phone: playerPhone,
        name: playerName,
        referralCode: rewards.referralEnabled && form.referral?.status === 'valid' ? form.code : null,
      });
      if (!result.ids) {
        form.setError(result.error ?? 'Could not complete the booking');
        return;
      }
      saveProfile({ name: playerName.trim(), phone: playerPhone });
      addMyBookingIds(result.ids);
      router.push(result.ids.length === 1 ? `/bookings/${result.ids[0]}` : `/bookings?new=${result.ids.join(',')}`);
    });
  };

  const cashback =
    rewards.cashbackEnabled && form.quote ? Math.min(rewards.cashbackMax, Math.floor((form.quote.total * rewards.cashbackPercent) / 100)) : 0;
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

      {/* 2 · Full or half pitch (only on turfs that split down the middle) */}
      {turf.halfPitch && <PitchPicker turf={turf} size={size} onChange={changeSize} />}

      {/* 3 · Slot map */}
      <div className={styles.stepHead}>
        <h3>Pick your slots</h3>
        <span className={styles.muted}>{loadingSlots ? 'Updating…' : `${availableCount} open`}</span>
      </div>

      <div className={styles.pitch} aria-hidden>
        <span>
          {primarySport(turf).icon} {size === 'half' ? 'Half pitch' : primarySport(turf).place === 'court' ? turf.size : `${turf.size} pitch`} · {dateInfo?.label}
        </span>
      </div>

      <SlotMap slots={slots} selected={selected} loading={loadingSlots} onToggle={toggleSlot} />

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

      {/* 4 · Checkout sheet */}
      {inCheckout && (
        <CheckoutSheet
          turf={turf}
          size={size}
          dateLabel={dateInfo?.label}
          selected={selected}
          selectedSlots={selectedSlots}
          secondsLeft={secondsLeft}
          paying={paying}
          signedIn={account.signedIn}
          cashback={cashback}
          form={form}
          onClose={() => closeCheckout()}
          onPay={pay}
        />
      )}

      {showGate &&
        createPortal(
          <SignInGate
            onClose={() => setShowGate(false)}
            onDone={() => {
              const p = getProfile();
              setShowGate(false);
              form.setName(p.name);
              form.setPhone(p.phone);
              form.setError('');
              reserve(p.name, p.phone);
            }}
          />,
          document.body
        )}
    </div>
  );
}

