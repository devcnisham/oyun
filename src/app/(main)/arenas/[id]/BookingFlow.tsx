'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createBookings, getSlotsForDate, holdSlots, releaseHolds } from '@/modules/web/backend/booking-actions';
import { clearDraft, loadDraft, saveDraft } from '@/modules/web/frontend/hooks/booking-draft';
import { addMyBookingIds, getProfile, saveProfile } from '@/modules/web/frontend/hooks/device';
import { useAccount, useOpenClerkSignIn } from '@/modules/web/frontend/hooks/use-account';
import { useSlotUpdates } from '@/modules/web/frontend/hooks/use-slot-updates';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import dynamic from 'next/dynamic';
import type { AddOn, Bookable, PitchSide, PitchSize, PublicTurf, Slot } from '@/modules/shared/database/types';
import { isHalfBookable, mapTurfToResourcesAndBookables } from '@/modules/shared/lib/venue-mapping';
import { MAX_SLOTS } from '@/modules/web/lib/booking-types';
import { rupees } from '@/modules/shared/lib/format';
import { parseHour } from '@/modules/shared/lib/time';
import { swapHours } from '@/modules/web/lib/side-hint';
import { describeHours } from './booking-format';
import { useCheckoutForm } from './useCheckoutForm';
import PitchPicker from './PitchPicker';
import SlotMap from './SlotMap';
import styles from './BookingFlow.module.css';

// Only needed once the player proceeds to checkout or sign-in
const CheckoutSheet = dynamic(() => import('./CheckoutSheet'));
const SignInGate = dynamic(() => import('@/modules/web/frontend/SignInGate'));

export interface BookingFlowProps {
  turf: PublicTurf;
  dates: { date: string; label: string; day: string; num: string }[];
  initialDate: string;
  initialSlots: Slot[];
  rewards: { cashbackEnabled: boolean; cashbackPercent: number; cashbackMax: number; referralEnabled: boolean; refereeReward: number };
  initialReferral: string;
  addOns?: AddOn[];
}

export default function BookingFlow({ turf, dates, initialDate, initialSlots, rewards, initialReferral, addOns }: BookingFlowProps) {
  const router = useRouter();
  const { bookables } = mapTurfToResourcesAndBookables(turf);
  const [selectedBookable, setSelectedBookable] = useState<Bookable | undefined>(() => bookables?.[0]);
  const [date, setDate] = useState(initialDate);
  const dateRef = useRef(initialDate); // the day on screen, for replies that arrive late
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selected, setSelected] = useState<number[]>([]);
  const [size, setSize] = useState<PitchSize>('full'); // whole pitch or one half (turfs that split)
  const [side, setSide] = useState<PitchSide | undefined>(); // which half, once the player picked one
  const [other, setOther] = useState<{ key: string; slots: Slot[] }>({ key: '', slots: [] }); // the other half's slots, to offer it when this one is taken
  const [loadingSlots, startSlotLoad] = useTransition();
  const [toast, setToast] = useState('');

  // Checkout state
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [paying, startPaying] = useTransition();
  const [showGate, setShowGate] = useState(false);
  const [gateFor, setGateFor] = useState<'proceed' | 'pay'>('pay'); // which step asked the player to sign in
  const pendingProceed = useRef(false); // Clerk's sign-in is open and Proceed should continue once it is done
  const proceedRef = useRef<(force?: boolean) => Promise<void>>(async () => {});
  useEffect(() => {
    dateRef.current = date;
  }, [date]);
  const draftReady = useRef(false); // false until a saved draft has been put back, so the first render cannot overwrite it
  const account = useAccount();
  const openClerkSignIn = useOpenClerkSignIn();
  const form = useCheckoutForm({
    turfId: turf.id,
    date,
    hours: selected,
    size,
    side,
    active: holdUntil !== null,
    referralEnabled: rewards.referralEnabled,
    initialCode: initialReferral,
    account,
    availableAddOns: addOns,
  });

  const { reset: resetForm } = form;
  const inCheckout = holdUntil !== null;
  const secondsLeft = holdUntil ? Math.max(0, Math.ceil((holdUntil - now) / 1000)) : 0;
  const selectedSlots = slots.filter((s) => selected.includes(s.hour));
  const estimate = selectedSlots.reduce((sum, s) => sum + s.price, 0);
  const listTotal = selectedSlots.reduce((sum, s) => sum + Math.max(s.basePrice, s.price), 0);
  const dateInfo = dates.find((d) => d.date === date);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((t) => (t === message ? '' : t)), 3200);
  }, []);

  // Keep the slot map live, like a cinema seat map
  const refreshSlots = useCallback(
    async (forDate: string) => {
      const fresh = await getSlotsForDate(turf.id, forDate, size, side);
      // A reply for a day the player has since left (or a saved pick restored on top of) must not replace the day on screen
      if (forDate !== dateRef.current) return;
      setSlots(fresh);
      setSelected((prev) => {
        const still = prev.filter((h) => fresh.find((s) => s.hour === h)?.available);
        if (still.length < prev.length) flash('A slot you picked was just taken');
        return still;
      });
    },
    [turf.id, size, side, flash]
  );

  // The page is served from the CDN, so the date and referral code in the address bar and the live slots are read here
  const urlRead = useRef(false);
  useEffect(() => {
    if (urlRead.current) return;
    urlRead.current = true;
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get('date');
    const next = wanted && dates.some((d) => d.date === wanted) ? wanted : date;
    const ref = (params.get('ref') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    queueMicrotask(() => {
      if (next !== date) setDate(next);
      refreshSlots(next).catch(() => {});
      if (ref) form.setCode(ref);
    });
  }, [dates, date, refreshSlots, form]);

  // A refresh keeps what the player had picked: the date, court, slots and, if they were in checkout, the held slots and their details
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = loadDraft(turf.id);
    const dateInUrl = new URLSearchParams(window.location.search).get('date');
    if (!draft || dateInUrl || !dates.some((d) => d.date === draft.date)) {
      if (draft && !dateInUrl) clearDraft(turf.id);
      draftReady.current = true;
      return;
    }
    getSlotsForDate(turf.id, draft.date, draft.size, draft.side)
      .then((fresh) => {
        const open = (h: number) => fresh.find((s) => s.hour === h)?.available;
        const hours = draft.hours.filter(open);
        const bookable = bookables?.find((b) => b.id === draft.bookableId);
        setDate(draft.date);
        setSize(draft.size);
        setSide(draft.side);
        if (bookable) setSelectedBookable(bookable);
        setSlots(fresh);
        setSelected(hours);
        form.restore(draft);
        // Back in checkout if they were in it. Leaving the page frees the held slots, so a refresh holds them again (for another 8 minutes)
        // when they are still free; if someone else took one meanwhile the player just keeps the rest of the picks
        const wasInCheckout = draft.holdUntil !== null && draft.holdUntil > Date.now() && hours.length === draft.hours.length && hours.length > 0;
        if (!wasInCheckout) {
          if (hours.length < draft.hours.length) flash('Some slots you picked are no longer available');
          return;
        }
        const stillHeld = hours.every((h) => fresh.find((s) => s.hour === h)?.heldByYou);
        if (stillHeld) {
          setNow(Date.now());
          setHoldUntil(draft.holdUntil);
          return;
        }
        return holdSlots(turf.id, draft.date, hours, draft.size, draft.side).then((held) => {
          setSlots(held.slots);
          if (held.ok) {
            const t = Date.now();
            setNow(t);
            setHoldUntil(t + held.expiresInMs);
          } else flash(held.error);
        });
      })
      .catch(() => {})
      .finally(() => {
        draftReady.current = true;
      });
  }, [turf.id, dates, bookables, form, flash]);

  // Save the picks as they change (nothing picked and not in checkout: nothing to keep)
  useEffect(() => {
    if (!draftReady.current) return;
    if (selected.length === 0 && holdUntil === null) {
      clearDraft(turf.id);
      return;
    }
    saveDraft({
      turfId: turf.id,
      date,
      hours: selected,
      size,
      side,
      bookableId: selectedBookable?.id,
      holdUntil,
      name: form.name,
      phone: form.phone,
      code: form.code,
      promo: form.promo,
      useWallet: form.useWallet,
      addOns: form.selectedAddOns,
      savedAt: Date.now(),
    });
  }, [turf.id, date, selected, size, side, selectedBookable, holdUntil, form.name, form.phone, form.code, form.promo, form.useWallet, form.selectedAddOns]);

  // Live seat map: other players' holds and bookings show up within a second
  const refreshCurrent = useCallback(() => {
    refreshSlots(date).catch(() => {});
  }, [date, refreshSlots]);
  useSlotUpdates(turf.id, date, refreshCurrent, !inCheckout);

  // On a split pitch, also look at the other half so a taken side can point to a free one
  useEffect(() => {
    if (size !== 'half' || !side || inCheckout) return;
    let live = true;
    getSlotsForDate(turf.id, date, 'half', side === 'A' ? 'B' : 'A')
      .then((fresh) => live && setOther({ key: `${date}${side}`, slots: fresh }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [turf.id, date, size, side, slots, inCheckout]);

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
  const reloadSlots = (nextDate: string, nextSize: PitchSize, nextSide: PitchSide | undefined = side) => {
    setSelected([]);
    startSlotLoad(async () => {
      setSlots(await getSlotsForDate(turf.id, nextDate, nextSize, nextSide));
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

  // A court picked on the pitch picker: the whole pitch, or one half (Right or Left)
  const pickBookable = (b: Bookable) => {
    setSelectedBookable(b);
    const nextSize: PitchSize = isHalfBookable(turf, b) ? 'half' : 'full';
    const nextSide: PitchSide | undefined = nextSize === 'half' ? (b.sort === 2 ? 'B' : 'A') : undefined;
    if (nextSize === size && nextSide === side) return;
    setSize(nextSize);
    setSide(nextSide);
    reloadSlots(date, nextSize, nextSide);
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

  const proceed = async (force = false) => {
    if (selected.length === 0 || holding) return;
    // Booking needs an account: ask to sign in or sign up before the checkout step, keeping what was picked
    if (!force && account.ready && !account.signedIn) {
      setGateFor('proceed');
      if (clerkEnabled) {
        pendingProceed.current = true;
        openClerkSignIn();
      } else setShowGate(true);
      return;
    }
    setHolding(true);
    try {
      const result = await holdSlots(turf.id, date, selected, size, side);
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

  // Continue to checkout as soon as a sign-in that was opened from Proceed finishes
  useEffect(() => {
    proceedRef.current = proceed;
  });
  useEffect(() => {
    if (account.signedIn && pendingProceed.current) {
      pendingProceed.current = false;
      void proceedRef.current(true);
    }
  }, [account.signedIn]);

  const pay = () => {
    form.setError('');
    // Booking needs an account: sign in or sign up first, without losing the held slots
    if (!account.signedIn) {
      setGateFor('pay');
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
      clearDraft(turf.id);
      router.push(result.ids.length === 1 ? `/bookings/${result.ids[0]}` : `/bookings?new=${result.ids.join(',')}`);
    });
  };

  const cashback =
    rewards.cashbackEnabled && form.quote ? Math.min(rewards.cashbackMax, Math.floor((form.quote.total * rewards.cashbackPercent) / 100)) : 0;
  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className={styles.flow}>
      <div className={styles.layoutGrid}>
      <div className={styles.steps}>
      {/* 1 · Date strip */}
      <div className={styles.stepCard}>
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
      </div>

      {/* 2 · Full or half pitch, or multi-court bookables (R007) */}
      {(turf.halfPitch || (bookables && bookables.length > 1)) && (
        <div className={styles.stepCard}>
        <PitchPicker
          turf={turf}
          size={size}
          onChange={changeSize}
          selectedBookableId={selectedBookable?.id}
          onBookableChange={pickBookable}
        />
        </div>
      )}

      {/* 3 · Slot map */}
      <div className={styles.stepCard}>
      <div className={styles.stepHead}>
        <h3>Pick your slots</h3>
        <span className={styles.muted}>{loadingSlots ? 'Updating…' : `${availableCount} open`}</span>
      </div>

      {size === 'half' && side && other.key === `${date}${side}` && swapHours(slots, other.slots).length > 0 && (() => {
        const hours = swapHours(slots, other.slots);
        const sideBookable = (want: PitchSide) => bookables?.find((b) => isHalfBookable(turf, b) && b.sort === (want === 'A' ? 1 : 2));
        const here = sideBookable(side)?.name ?? 'This side';
        const there = sideBookable(side === 'A' ? 'B' : 'A');
        return (
          <p className={styles.sideHint} role="status">
            {here} is taken at {describeHours(hours, parseHour(turf.openTime))}.{' '}
            {there && (
              <button type="button" className={styles.linkBtn} onClick={() => pickBookable(there)}>
                See {there.name} instead
              </button>
            )}
          </p>
        );
      })()}
      <SlotMap slots={slots} selected={selected} loading={loadingSlots} onToggle={toggleSlot} />
      </div>
      </div>

      {/* Desktop: sticky reservation summary beside the steps (phones use the bar below) */}
      <aside className={styles.summary} aria-label="Your reservation">
        <span className={styles.summaryEyebrow}>Your reservation</span>
        <h3 className={styles.summaryTitle}>{turf.name}</h3>
        <p className={styles.summaryMuted}>{turf.area}, Mangalore</p>
        <dl className={styles.summaryList}>
          <div><dt>Date</dt><dd>{dateInfo?.label}</dd></div>
          <div><dt>Pitch</dt><dd>{selectedBookable ? selectedBookable.name : size === 'half' ? 'Half pitch' : turf.size}</dd></div>
          <div><dt>Time</dt><dd>{selected.length > 0 ? describeHours(selected, parseHour(turf.openTime)) : 'Pick your slots'}</dd></div>
          <div><dt>Slots</dt><dd>{selected.length}</dd></div>
        </dl>
        <div className={styles.summaryTotal}>
          <span>Total</span>
          <b>
            {selected.length > 0 && listTotal > estimate && <s className={styles.wasPrice}>{rupees(listTotal)}</s>}
            {selected.length > 0 ? rupees(estimate) : '₹0'}
          </b>
        </div>
        <button className={styles.primary} onClick={() => proceed()} disabled={holding || selected.length === 0}>
          {holding ? 'Holding…' : 'Proceed to checkout'}
        </button>
        <p className={styles.summaryNote}>Nothing is charged online. Pay at the turf.</p>
      </aside>
      </div>

      {/* Sticky selection bar */}
      <div className={`${styles.bar} ${selected.length > 0 && !inCheckout ? styles.barShow : ''}`}>
        <div className={styles.barInfo}>
          <b>
            {selectedBookable ? `${selectedBookable.name} · ` : ''}
            {selected.length} slot{selected.length === 1 ? '' : 's'} · {rupees(estimate)}
          </b>
          <span>{dateInfo?.label} · {describeHours(selected, parseHour(turf.openTime))}</span>
        </div>
        <button className={styles.primary} onClick={() => proceed()} disabled={holding || selected.length === 0}>
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
          bookableName={selectedBookable?.name}
          dateLabel={dateInfo?.label}
          selected={selected}
          selectedSlots={selectedSlots}
          secondsLeft={secondsLeft}
          paying={paying}
          signedIn={account.signedIn}
          cashback={cashback}
          form={form}
          addOns={addOns}
          onClose={() => closeCheckout()}
          onPay={pay}
        />
      )}

      {showGate &&
        createPortal(
          <SignInGate
            note={gateFor === 'proceed' ? 'The slots you picked are saved while you sign in.' : undefined}
            onClose={() => setShowGate(false)}
            onDone={() => {
              const p = getProfile();
              setShowGate(false);
              form.setName(p.name);
              form.setPhone(p.phone);
              form.setError('');
              if (gateFor === 'proceed') {
                void proceed(true);
                return;
              }
              reserve(p.name, p.phone);
            }}
          />,
          document.body
        )}
    </div>
  );
}

