'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { canOptimize } from '@/lib/images';
import { checkReferralCode, createBooking, getBookingQuote, getSlotsForDate, type PublicQuote, type ReferralCheck } from '@/lib/booking-actions';
import type { AddOn, Offer, Slot, Turf } from '@/lib/types';
import PaymentGatewayDemo from '@/components/PaymentGatewayDemo';
import styles from './page.module.css';

interface TurfDetailProps {
  turf: Turf;
  dates: { date: string; label: string }[];
  initialDate: string;
  initialSlots: Slot[];
  addOns: AddOn[];
  offers: Offer[];
  advancePercent: number;
  bookable: boolean;
  rewards: { cashbackEnabled: boolean; cashbackPercent: number; cashbackMax: number; referralEnabled: boolean; refereeReward: number };
  initialReferral: string;
}

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;

export default function TurfDetail({ turf, dates, initialDate, initialSlots, addOns, offers, advancePercent, bookable, rewards, initialReferral }: TurfDetailProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [loadingSlots, startSlotLoad] = useTransition();
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [selectedFormat, setSelectedFormat] = useState(turf.formats[0] ?? '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [code, setCode] = useState(initialReferral || '');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [codeError, setCodeError] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'full' | 'advance'>('full');
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [referralCheck, setReferralCheck] = useState<ReferralCheck | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [booking, startBooking] = useTransition();

  const selectedSlot = slots.find((s) => selectedHours.includes(s.hour) && s.available) ?? null;
  const phoneDigits = phone.replace(/\D/g, '');
  const validPhone = phoneDigits.length === 10 ? phoneDigits : '';
  const addOnList = useMemo(() => Object.entries(qty).filter(([, n]) => n > 0).map(([id, n]) => ({ id, qty: n })), [qty]);

  const fetchCombinedQuote = async (hours: number[], promo: string | null) => {
    if (hours.length === 0) return null;
    const quotes = await Promise.all(
      hours.map((hour) =>
        getBookingQuote({ turfId: turf.id, date, hour, promoCode: promo, addOns: addOnList, useWallet, phone: validPhone })
      )
    );
    if (quotes.some((q) => !q)) return null;

    // Combine quotes
    const combined: PublicQuote = {
      breakdown: {
        basePrice: quotes.reduce((acc, q) => acc + q!.breakdown.basePrice, 0),
        adjustments: quotes.flatMap((q) => q!.breakdown.adjustments),
        slotPrice: quotes.reduce((acc, q) => acc + q!.breakdown.slotPrice, 0),
        offer: quotes[0]!.breakdown.offer,
        promo: quotes[0]!.breakdown.promo,
        addOnTotal: quotes.reduce((acc, q) => acc + q!.breakdown.addOnTotal, 0),
        subtotal: quotes.reduce((acc, q) => acc + q!.breakdown.subtotal, 0),
        walletDeduction: quotes.reduce((acc, q) => acc + q!.breakdown.walletDeduction, 0),
        total: quotes.reduce((acc, q) => acc + q!.breakdown.total, 0),
        advance: quotes.reduce((acc, q) => acc + q!.breakdown.advance, 0),
      },
      addOns: quotes[0]!.addOns,
      promoCode: quotes[0]!.promoCode,
      promoError: quotes.find((q) => q!.promoError)?.promoError || null,
      walletBalance: quotes[0]!.walletBalance,
      firstTime: quotes[0]!.firstTime,
      slotError: quotes.find((q) => q!.slotError)?.slotError || null,
    };
    return combined;
  };

  // Server recalculates the full price whenever the selection changes
  useEffect(() => {
    if (selectedHours.length === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    fetchCombinedQuote(selectedHours, appliedPromo).then((q) => {
      if (!cancelled) setQuote(q);
    });
    return () => {
      cancelled = true;
    };
  }, [turf.id, date, selectedHours, appliedPromo, addOnList, useWallet, validPhone]);

  const changeDate = (next: string) => {
    setDate(next);
    setSelectedHours([]);
    setQuote(null);
    startSlotLoad(async () => {
      setSlots(await getSlotsForDate(turf.id, next));
    });
  };

  const handleApplyCode = async () => {
    if (appliedPromo || referralCheck?.status === 'valid') {
      setAppliedPromo(null);
      setReferralCheck(null);
      setCode('');
      setCodeError('');
      return;
    }
    if (selectedHours.length === 0 || !code.trim()) return;
    
    // 1. Try applying as a promo code
    const q = await fetchCombinedQuote(selectedHours, code);
    if (!q) return;
    if (!q.promoError && q.promoCode) {
      setCodeError('');
      setAppliedPromo(q.promoCode);
      setQuote(q);
      return;
    }

    // 2. Try applying as a referral code
    if (rewards.referralEnabled) {
      const refCheck = await checkReferralCode(code, validPhone);
      if (refCheck.status === 'valid') {
        setCodeError('');
        setReferralCheck(refCheck);
        return;
      }
      if (refCheck.status === 'not_new') {
        setCodeError("Referral codes are for a player's first booking only.");
        return;
      }
    }

    setCodeError(q?.promoError ?? 'Invalid promo or referral code');
  };

  const handleBookClick = () => {
    setBookingError('');
    if (selectedHours.length === 0) return;
    if (!name.trim()) return setBookingError('Enter your name');
    if (!validPhone) return setBookingError('Enter a 10-digit mobile number');
    setShowPayment(true);
  };

  const processBooking = () => {
    if (selectedHours.length === 0) return;
    setShowPayment(false);
    startBooking(async () => {
      const results = await Promise.all(
        selectedHours.map((hour) =>
          createBooking({
            referralCode: rewards.referralEnabled && referralCheck?.status === 'valid' ? code : null,
            turfId: turf.id,
            date,
            hour,
            promoCode: appliedPromo,
            addOns: addOnList,
            useWallet,
            phone: validPhone,
            name,
            paymentMode,
          })
        )
      );

      const successfulIds = results.filter((r) => r.id).map((r) => r.id);
      
      if (successfulIds.length > 0) {
        // Redirect to the first successful booking for now
        router.push(`/bookings/${successfulIds[0]}`);
      } else {
        setBookingError(results[0]?.error ?? 'Could not book these slots');
        setSlots(await getSlotsForDate(turf.id, date));
      }
    });
  };

  const q = quote?.breakdown;
  const fallbackTotal = selectedSlot?.price ?? turf.pricePerHour;
  const cashback = rewards.cashbackEnabled ? Math.min(rewards.cashbackMax, Math.floor(((q?.total ?? fallbackTotal) * rewards.cashbackPercent) / 100)) : 0;
  const total = q?.total ?? fallbackTotal;
  const advance = q?.advance ?? Math.round((fallbackTotal * advancePercent) / 100);
  const displayPrice = paymentMode === 'full' ? total : advance;
  const imageSrc = turf.images[0];

  return (
    <div className={styles.page}>
      {/* Mobile Image Header */}
      <div className={styles.imageHeader}>
        <Image src={imageSrc} alt={turf.name} fill preload sizes="100vw" className={styles.mainImage} unoptimized={!canOptimize(imageSrc)} />

        <div className={styles.topNav}>
          <Link href="/arenas" className={styles.iconBtn} aria-label="Back to arenas">←</Link>
          <div className={styles.midBadge}>{turf.isVerified ? 'Verified Turf' : 'Premium Turf'}</div>
          <div className={styles.topNavRight}>
            <button
              className={styles.iconBtn}
              aria-label="Share"
              onClick={() => {
                if (navigator.share) navigator.share({ title: turf.name, url: window.location.href }).catch(() => {});
                else navigator.clipboard?.writeText(window.location.href);
              }}
            >
              ➦
            </button>
          </div>
        </div>

        <div className={styles.imageCounter}>📸 1/{turf.images.length}</div>
      </div>

      <div className={`container ${styles.content} ${styles.layout}`}>
        {/* Left column (top on mobile): turf name and highlights */}
        <div className={styles.info}>
        <span className={styles.typeBadge}>{turf.size} · {turf.surface}</span>
        <h1 className={styles.title}>{turf.name}</h1>

        <div className={styles.ratingRow}>
          {turf.reviewCount > 0 ? (
            <>
              <span className={styles.ratingBadge}>★ {turf.rating}</span>
              <span className={styles.ratingText}>({turf.reviewCount} ratings)</span>
            </>
          ) : (
            <span className={styles.ratingBadge}>New</span>
          )}
        </div>

        <div className={styles.addressBlock}>
          <p>{turf.location}</p>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(`${turf.name} ${turf.location}`)}`} target="_blank" rel="noreferrer" className={styles.mapLink}>View on map</a>
        </div>

        {offers.length > 0 && (
          <div className={styles.offerStrip}>
            {offers.map((o) => (
              <div key={o.id} className={styles.offerChip}>
                🏷️ <strong>{o.title}</strong> · {o.percentOff}% off{' '}
                {o.type === 'first_time' ? 'your first booking' : `${hourLabel(o.startHour)}–${hourLabel(o.endHour)}`}
              </div>
            ))}
          </div>
        )}

        <hr className={styles.divider} />

        <div className={styles.whyBook}>
          <h2>Why book this turf?</h2>
          <div className={styles.perk}>
            <span className={styles.perkIcon}>🏟️</span>
            <div><h4 className={styles.perkTitle}>{turf.surface}</h4></div>
          </div>
          {turf.isVerified && (
            <div className={styles.perk}>
              <span className={styles.perkIcon}>✓</span>
              <div><h4 className={styles.perkTitle}>Inspected and verified by OYUN</h4></div>
            </div>
          )}
          <div className={styles.perk}>
            <span className={styles.perkIcon}>💡</span>
            <div><h4 className={styles.perkTitle}>Open {turf.openTime} – {turf.closeTime}</h4></div>
          </div>
        </div>

        </div>

        {/* Right column: booking panel, sticky on desktop */}
        <aside className={styles.bookingPanel}>
        <h2 className={styles.panelTitle}>Book a slot</h2>
        {!bookable ? (
          <div className={styles.notice}>This turf is under maintenance and not taking bookings right now.</div>
        ) : (
          <>
            {turf.formats.length > 1 && (
              <div className={styles.bookingSection} style={{ marginBottom: '24px' }}>
                <h2>Select Pitch Format</h2>
                <div className={styles.slotsGrid}>
                  {turf.formats.map((format) => (
                    <button
                      key={format}
                      className={`${styles.slotBtn} ${selectedFormat === format ? styles.slotBtnSelected : ''}`}
                      onClick={() => setSelectedFormat(format)}
                    >
                      <span className={styles.slotTime}>{format}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.bookingSection} style={{ marginBottom: '24px' }}>
              <h2>Select Date</h2>
              <div className={styles.dateChips}>
                {dates.map((d) => (
                  <button
                    key={d.date}
                    className={`${styles.dateChip} ${d.date === date ? styles.dateChipActive : ''}`}
                    onClick={() => changeDate(d.date)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.bookingSection}>
              <h2>Select Time Slot</h2>
              {loadingSlots ? (
                <p className={styles.mutedText}>Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className={styles.mutedText}>No slots for this day.</p>
              ) : (
                <div className={styles.slotsGrid}>
                  {slots.map((slot) => (
                    <button
                      key={slot.hour}
                      className={`${styles.slotBtn} ${!slot.available ? styles.slotBtnBooked : ''} ${selectedHours.includes(slot.hour) ? styles.slotBtnSelected : ''}`}
                      onClick={() => {
                        if (!slot.available) return;
                        setSelectedHours(prev => 
                          prev.includes(slot.hour) 
                            ? prev.filter(h => h !== slot.hour)
                            : [...prev, slot.hour]
                        );
                      }}
                      disabled={!slot.available}
                    >
                      <span className={styles.slotTime}>{slot.label}</span>
                      {slot.available ? (
                        <>
                          <span className={styles.slotPrice}>₹{slot.price}</span>
                          {slot.tags.map((t) => (
                            <span key={t} className={styles.slotTag}>{t}</span>
                          ))}
                        </>
                      ) : (
                        <span className={styles.slotTag}>{slot.reason === 'past' ? 'Over' : slot.reason === 'blocked' ? 'Unavailable' : 'Booked'}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedHours.length > 0 && (
              <div className={styles.paymentOptions}>

                <h2 style={{ marginTop: '24px' }}>Payment & Offers</h2>

                <div className={styles.promoBox}>
                  <div className={styles.promoInputWrapper}>
                    <input
                      type="text"
                      placeholder="Enter Promo or Referral Code"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(''); }}
                      className={styles.promoInput}
                      disabled={appliedPromo !== null || referralCheck?.status === 'valid'}
                    />
                    <button className={styles.promoBtn} onClick={handleApplyCode}>
                      {appliedPromo || referralCheck?.status === 'valid' ? 'Remove' : 'Apply'}
                    </button>
                  </div>
                  {codeError && <p className={styles.errorText}>{codeError}</p>}
                  {appliedPromo && q?.promo && <p className={styles.successText}>Promo applied: -₹{-q.promo.amount}</p>}
                  {referralCheck?.status === 'valid' && (
                    <p className={styles.successText}>Code from {referralCheck.referrerName} applied — you get ₹{referralCheck.reward} in your wallet after your first game.</p>
                  )}
                </div>

                {(quote?.walletBalance ?? 0) > 0 && (
                  <div className={styles.walletBox}>
                    <label className={styles.walletToggle}>
                      <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className={styles.walletCheckbox} />
                      <span className={styles.walletInfo}>
                        <strong>Use Wallet Balance (₹{quote?.walletBalance})</strong>
                        {useWallet && q && <span className={styles.walletAppliedText}> -₹{q.walletDeduction} applied</span>}
                      </span>
                    </label>
                  </div>
                )}

                {q && (
                  <>
                    <div className={styles.breakdown}>
                      <div className={styles.breakdownRow}><span>{selectedHours.length > 1 ? `${selectedHours.length} Slots` : selectedSlot?.label ?? 'Slot'}</span><span>₹{q.basePrice}</span></div>
                      {q.adjustments.map((a) => (
                        <div key={a.label} className={styles.breakdownRow}><span>{a.label}</span><span>{a.amount > 0 ? '+' : '−'}₹{Math.abs(a.amount)}</span></div>
                      ))}
                      {q.offer && <div className={`${styles.breakdownRow} ${styles.discount}`}><span>{q.offer.label}</span><span>−₹{-q.offer.amount}</span></div>}
                      {q.promo && <div className={`${styles.breakdownRow} ${styles.discount}`}><span>{q.promo.label}</span><span>−₹{-q.promo.amount}</span></div>}
                      {quote?.addOns.map((a) => (
                        <div key={a.id} className={styles.breakdownRow}><span>{a.name} × {a.qty}</span><span>₹{a.price * a.qty}</span></div>
                      ))}
                      {q.walletDeduction > 0 && <div className={`${styles.breakdownRow} ${styles.discount}`}><span>Wallet</span><span>−₹{q.walletDeduction}</span></div>}
                      <div className={`${styles.breakdownRow} ${styles.breakdownTotal}`}><span>Total (incl. GST)</span><span>₹{q.total}</span></div>
                    </div>

                    <h2 style={{ marginTop: '24px' }}>Payment Options</h2>
                    <div className={styles.paymentToggle}>
                      <label className={`${styles.payRadio} ${paymentMode === 'advance' ? styles.payActive : ''}`}>
                        <input type="radio" name="paymentMode" checked={paymentMode === 'advance'} onChange={() => setPaymentMode('advance')} />
                        <div className={styles.payInfo}>
                          <span className={styles.payTitle}>Pay {advancePercent}% Advance</span>
                          <span className={styles.payDesc}>₹{advance} now, rest at venue</span>
                        </div>
                      </label>
                      <label className={`${styles.payRadio} ${paymentMode === 'full' ? styles.payActive : ''}`}>
                        <input type="radio" name="paymentMode" checked={paymentMode === 'full'} onChange={() => setPaymentMode('full')} />
                        <div className={styles.payInfo}>
                          <span className={styles.payTitle}>Pay Full Amount</span>
                          <span className={styles.payDesc}>₹{total} now, skip the hassle</span>
                        </div>
                      </label>
                    </div>
                  </>
                )}


                {cashback > 0 && (
                  <p className={styles.successText} style={{ marginTop: 12 }}>💰 Earn ₹{cashback} cashback in your OYUN wallet when you check in.</p>
                )}
                {bookingError && <p className={styles.errorText} role="alert">{bookingError}</p>}
              </div>
            )}
          </>
        )}

        {bookable && selectedSlot && q && (
          <div className={`${styles.panelFooter} ${styles.slideUp}`}>
            <div className={styles.compactDetailsForm}>
              <input className={styles.compactInput} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <input className={styles.compactInput} placeholder="Phone number" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => code && handleApplyCode()} autoComplete="tel" />
            </div>

            <div className={styles.stickyBottomRow}>
              <div className={styles.priceInfo}>
                <div className={styles.priceRow}>
                  <span className={styles.priceFinal}>₹{displayPrice}</span>
                </div>
                {selectedSlot && <span className={styles.priceTaxes}>{selectedSlot.label}</span>}
              </div>
              <button className={styles.bookBtn} disabled={!selectedSlot || booking} onClick={handleBookClick}>
                {booking ? 'Booking…' : 'Pay now'}
              </button>
            </div>
          </div>
        )}
        </aside>

        {/* Left column (bottom on mobile): full details */}
        <div className={styles.more}>
        <div className={styles.detailsSection}>
          <h2>About {turf.name}</h2>
          <p className={styles.description}>{turf.description}</p>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Sports</span>
              <span className={styles.infoValue}>{turf.sports.join(', ')}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Format</span>
              <span className={styles.infoValue}>{turf.size}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Contact</span>
              <span className={styles.infoValue}>{turf.ownerName} ({turf.phone})</span>
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.amenitiesSection}>
          <h2>Amenities</h2>
          <div className={styles.amenitiesGrid}>
            {turf.amenities.map((a) => (
              <span key={a} className={styles.amenityTag}>✓ {a}</span>
            ))}
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.mapSection}>
          <h2>Location Preview</h2>
          <div className={styles.mapContainer}>
            <iframe
              title={`${turf.name} on map`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(turf.name + ' ' + turf.location)}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        </div>
        <div className={styles.bottomSpacer} />
      </div>

      {bookable && selectedSlot && q && (
        <div className={styles.stickyBottom}>
          <div className={styles.compactDetailsForm}>
            <input className={styles.compactInput} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <input className={styles.compactInput} placeholder="Phone number" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => code && handleApplyCode()} autoComplete="tel" />
          </div>

          <div className={styles.stickyBottomRow}>
            <div className={styles.priceInfo}>
              <div className={styles.priceRow}>
                <span className={styles.priceFinal}>₹{displayPrice}</span>
              </div>
              {selectedSlot && <span className={styles.priceTaxes}>{selectedSlot.label}</span>}
            </div>
            <button className={styles.bookBtn} disabled={!selectedSlot || booking} onClick={handleBookClick}>
              {booking ? 'Booking…' : <>Pay now</>}
            </button>
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentGatewayDemo 
          amount={displayPrice} 
          onSuccess={processBooking} 
          onCancel={() => setShowPayment(false)} 
        />
      )}
    </div>
  );
}
