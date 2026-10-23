import StudentIdBox from './StudentIdBox';
import { createPortal } from 'react-dom';
import { useDialogFocus } from '@/lib/client/use-dialog-focus';
import type { SelectionQuote } from '@/lib/booking-types';
import type { AddOn, PitchSize, PublicTurf, Slot } from '@/lib/types';
import { rupees, shortHour } from '@/lib/format';
import { describeHours } from './booking-format';
import styles from './BookingFlow.module.css';
import type { CheckoutForm } from './useCheckoutForm';

interface CheckoutSheetProps {
  turf: PublicTurf;
  size: PitchSize;
  bookableName?: string;
  dateLabel: string | undefined;
  selected: number[];
  selectedSlots: Slot[];
  secondsLeft: number;
  paying: boolean;
  signedIn: boolean;
  cashback: number;
  form: CheckoutForm;
  addOns?: AddOn[];
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
export default function CheckoutSheet({ turf, size, bookableName, dateLabel, selected, selectedSlots, secondsLeft, paying, signedIn, cashback, form, addOns, onClose, onPay }: CheckoutSheetProps) {
  const { quote, error, name, phone, code, codeError, codeApplied, promo, referral, useWallet, selectedAddOns, setAddOnQty } = form;
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose, !paying);
  const chips = quote?.slots ?? selectedSlots.map((s) => ({ hour: s.hour, label: s.label, price: s.price }));

  return createPortal(
    <div className={`${styles.flow} ${styles.overlay}`} onClick={(e) => e.target === e.currentTarget && !paying && onClose()}>
      <div ref={dialogRef} className={styles.sheet} role="dialog" aria-modal="true" aria-label="Checkout">
        <div className={styles.sheetHead}>
          <button className={styles.back} onClick={onClose} disabled={paying} aria-label="Back to slots">←</button>
          <h2>Checkout</h2>
          <span className={`${styles.timer} ${secondsLeft < 60 ? styles.timerLow : ''}`} aria-live="polite">
            ⏱ {clock(secondsLeft)}
          </span>
        </div>

        <div className={styles.sheetBody}>
          <div className={styles.coLeft}>
          <section>
            <h3>Your details</h3>
            <div className={styles.fields}>
              <input className={styles.input} name="name" aria-label="Full name" placeholder="Full name" value={name} onChange={(e) => form.setName(e.target.value)} autoComplete="name" />
              <input className={styles.input} name="phone" type="tel" aria-label="10-digit mobile number" placeholder="10-digit mobile number" inputMode="numeric" value={phone} onChange={(e) => form.setPhone(e.target.value)} autoComplete="tel-national" />
            </div>
          </section>
          <StudentIdBox name={name} phone={phone} />

          <section>
            <h3>Offers</h3>
            <div className={styles.codeRow}>
              <input
                className={styles.input}
                aria-label="Promo or referral code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Promo or referral code"
                value={code}
                onChange={(e) => form.setCode(e.target.value.toUpperCase())}
                disabled={codeApplied}
              />
              <button className={styles.secondary} onClick={form.applyCode}>{codeApplied ? 'Remove' : 'Apply'}</button>
            </div>
            {codeError && <p className={styles.error}>{codeError}</p>}
            {promo && <p className={styles.success}>Code {promo} applied</p>}
            {referral?.status === 'valid' && (
              <p className={styles.success}>Code from {referral.referrerName} applied: you get {rupees(referral.reward)} in your wallet after your first game.</p>
            )}
            {quote && quote.walletBalance > 0 && (
              <label className={styles.toggle}>
                <input type="checkbox" checked={useWallet} onChange={(e) => form.setUseWallet(e.target.checked)} />
                <span>Use wallet balance ({rupees(quote.walletBalance)})</span>
              </label>
            )}
          </section>

          {/* Add-ons & Equipment Selection (P13-09) */}
          {addOns && addOns.length > 0 && (
            <section>
              <h3>Add-ons & Equipment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
                {addOns.map((addon) => {
                  const qty = selectedAddOns?.find((a) => a.id === addon.id)?.qty ?? 0;
                  return (
                    <div key={addon.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-muted, #f8f9fa)', borderRadius: 10 }}>
                      <div>
                        <b style={{ fontSize: 14 }}>{addon.name}</b>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted, #666)' }}>{rupees(addon.price)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setAddOnQty(addon.id, Math.max(0, qty - 1))}
                          disabled={qty === 0}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontWeight: 800 }}
                          aria-label={`Decrease ${addon.name}`}
                        >
                          −
                        </button>
                        <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{qty}</span>
                        <button
                          type="button"
                          onClick={() => setAddOnQty(addon.id, qty + 1)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontWeight: 800 }}
                          aria-label={`Increase ${addon.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className={styles.venueNote}>
            <h3>Payment</h3>
            <p>💵 Nothing is charged online. You pay at the turf by cash or UPI: {advanceSummary(quote)} when you arrive, and the balance after you play.</p>
          </section>

          </div>
          <aside className={styles.coRight}>
          <div className={styles.ticket}>
            <div>
              <b>{turf.name}</b>
              <span className={styles.muted}>{turf.area} · {bookableName ?? (size === 'half' ? 'Half pitch' : turf.size)}</span>
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

          {quote && (
            <section className={styles.bill}>
              <div><span>Slots ({quote.slots.length})</span><span>{rupees(quote.slotTotal)}</span></div>
              {quote.addOnTotal > 0 && (
                <div style={{ color: 'var(--text-accent, #047857)' }}>
                  <span>Add-ons ({quote.addOns.reduce((s, a) => s + a.qty, 0)})</span>
                  <span>+{rupees(quote.addOnTotal)}</span>
                </div>
              )}
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
            <div className={`${styles.sheetFoot} ${styles.footDesktop}`}>
<div className={styles.barInfo}>
                <b>{quote ? rupees(quote.payNow) : '…'}</b>
                <span>Advance due at the turf</span>
              </div>
              <button className={styles.primary} onClick={onPay} disabled={!quote || paying}>
                {paying ? 'Reserving…' : signedIn ? 'Confirm booking' : 'Sign in to confirm'}
              </button>
                    </div>
          </aside>
        </div>

        <div className={`${styles.sheetFoot} ${styles.footMobile}`}>
          <div className={styles.barInfo}>
            <b>{quote ? rupees(quote.payNow) : '…'}</b>
            <span>Advance due at the turf</span>
          </div>
          <button className={styles.primary} onClick={onPay} disabled={!quote || paying}>
            {paying ? 'Reserving…' : signedIn ? 'Confirm booking' : 'Sign in to confirm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
