import { createPortal } from 'react-dom';
import type { ReferralCheck } from '@/lib/booking-actions';
import type { SelectionQuote } from '@/lib/booking-types';
import type { PitchSize, PublicTurf, Slot } from '@/lib/types';
import { rupees, shortHour } from '@/lib/format';
import { describeHours } from './booking-format';
import styles from './BookingFlow.module.css';

interface CheckoutSheetProps {
  turf: PublicTurf;
  size: PitchSize;
  dateLabel: string | undefined;
  selected: number[];
  selectedSlots: Slot[];
  quote: SelectionQuote | null;
  secondsLeft: number;
  paying: boolean;
  signedIn: boolean;
  error: string;
  cashback: number;
  name: string;
  phone: string;
  code: string;
  codeError: string;
  promo: string | null;
  codeApplied: boolean;
  referral: ReferralCheck | null;
  useWallet: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onApplyCode: () => void;
  onUseWalletChange: (value: boolean) => void;
  onClose: () => void;
  onPay: () => void;
}

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const isFlatAdvance = (quote: SelectionQuote) => quote.minAdvance === quote.maxAdvance;

function advanceSummary(quote: SelectionQuote | null) {
  if (!quote) return 'an advance of ₹150 per hour';
  return `an advance of ${rupees(quote.minAdvance)}${isFlatAdvance(quote) ? '' : ` to ${rupees(quote.maxAdvance)}`} per hour`;
}

/** Bottom sheet shown while the player's slots are held: details, offers, bill and confirm. */
export default function CheckoutSheet(props: CheckoutSheetProps) {
  const { turf, size, dateLabel, selected, selectedSlots, quote, secondsLeft, paying, signedIn, error, cashback } = props;
  const { name, phone, code, codeError, promo, referral, useWallet, codeApplied } = props;
  const chips = quote?.slots ?? selectedSlots.map((s) => ({ hour: s.hour, label: s.label, price: s.price }));

  return createPortal(
    <div className={`${styles.flow} ${styles.overlay}`} onClick={(e) => e.target === e.currentTarget && !paying && props.onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Checkout">
        <div className={styles.sheetHead}>
          <button className={styles.back} onClick={props.onClose} disabled={paying} aria-label="Back to slots">←</button>
          <h2>Checkout</h2>
          <span className={`${styles.timer} ${secondsLeft < 60 ? styles.timerLow : ''}`} aria-live="polite">
            ⏱ {clock(secondsLeft)}
          </span>
        </div>

        <div className={styles.sheetBody}>
          <div className={styles.ticket}>
            <div>
              <b>{turf.name}</b>
              <span className={styles.muted}>{turf.area} · {size === 'half' ? 'Half pitch' : turf.size}</span>
            </div>
            <div className={styles.ticketRow}>
              <span>{dateLabel}</span>
              <b>{describeHours(selected)}</b>
            </div>
            <div className={styles.chips}>
              {chips.map((s) => (
                <span key={s.hour} className={styles.chip}>{shortHour(s.hour)} · {rupees(s.price)}</span>
              ))}
            </div>
            <p className={styles.holdNote}>🔒 These slots are reserved for you until the timer runs out.</p>
          </div>

          <section>
            <h3>Your details</h3>
            <div className={styles.fields}>
              <input className={styles.input} placeholder="Full name" value={name} onChange={(e) => props.onNameChange(e.target.value)} autoComplete="name" />
              <input className={styles.input} placeholder="10-digit mobile number" inputMode="numeric" value={phone} onChange={(e) => props.onPhoneChange(e.target.value)} autoComplete="tel" />
            </div>
          </section>

          <section>
            <h3>Offers</h3>
            <div className={styles.codeRow}>
              <input
                className={styles.input}
                placeholder="Promo or referral code"
                value={code}
                onChange={(e) => props.onCodeChange(e.target.value.toUpperCase())}
                disabled={codeApplied}
              />
              <button className={styles.secondary} onClick={props.onApplyCode}>{codeApplied ? 'Remove' : 'Apply'}</button>
            </div>
            {codeError && <p className={styles.error}>{codeError}</p>}
            {promo && <p className={styles.success}>Code {promo} applied</p>}
            {referral?.status === 'valid' && (
              <p className={styles.success}>Code from {referral.referrerName} applied: you get {rupees(referral.reward)} in your wallet after your first game.</p>
            )}
            {quote && quote.walletBalance > 0 && (
              <label className={styles.toggle}>
                <input type="checkbox" checked={useWallet} onChange={(e) => props.onUseWalletChange(e.target.checked)} />
                <span>Use wallet balance ({rupees(quote.walletBalance)})</span>
              </label>
            )}
          </section>

          <section className={styles.venueNote}>
            <h3>Payment</h3>
            <p>💵 Nothing is charged online. You pay at the turf by cash or UPI: {advanceSummary(quote)} when you arrive, and the balance after you play.</p>
          </section>

          {quote && (
            <section className={styles.bill}>
              <div><span>Slots ({quote.slots.length})</span><span>{rupees(quote.slotTotal)}</span></div>
              {quote.adjustments.map((a) => (
                <div key={a.label} className={styles.discount}><span>{a.label}</span><span>−{rupees(-a.amount)}</span></div>
              ))}
              {quote.walletDeduction > 0 && <div className={styles.discount}><span>Wallet</span><span>−{rupees(quote.walletDeduction)}</span></div>}
              <div><span>Total (incl. GST)</span><span>{rupees(quote.total)}</span></div>
              <div className={styles.billTotal}>
                <span>Advance at the turf ({isFlatAdvance(quote) && quote.slots.length > 1 ? `${quote.slots.length} × ${rupees(quote.minAdvance)}` : `${quote.advancePercent}%`})</span>
                <span>{rupees(quote.payNow)}</span>
              </div>
              <div className={styles.billBalance}><span>Balance after you play</span><span>{rupees(quote.payAtVenue)}</span></div>
              {cashback > 0 && <p className={styles.success}>💰 Earn {rupees(cashback)} cashback when you check in</p>}
            </section>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>

        <div className={styles.sheetFoot}>
          <div className={styles.barInfo}>
            <b>{quote ? rupees(quote.payNow) : '…'}</b>
            <span>Advance due at the turf</span>
          </div>
          <button className={styles.primary} onClick={props.onPay} disabled={!quote || paying}>
            {paying ? 'Reserving…' : signedIn ? 'Confirm booking' : 'Sign in to confirm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
