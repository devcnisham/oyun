import BookingCountdown from '@/modules/web/frontend/main/bookings/id/BookingCountdown';
import BookingActionIcon from '@/modules/web/frontend/main/bookings/id/BookingActionIcon';
import { maskPhone } from '@/modules/shared/lib/phone';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { bookingQrPayload } from '@/modules/shared/lib/booking-qr';
import { qrSvg, qrPng } from '@/modules/web/lib/qr';
import { getDb } from '@/modules/shared/database/store';
import { addDays, formatDate, formatDateTime, formatSlotRange, parseHour } from '@/modules/shared/lib/time';
import { WALLET_TXN_LABELS, cashbackFor } from '@/modules/shared/lib/wallet';
import styles from './page.module.css';
import BackButton from '@/modules/web/frontend/BackButton';
import ReviewForm from '@/modules/web/frontend/main/bookings/id/ReviewForm';
import { halfNote } from '@/modules/shared/lib/pricing';

const STATUS_TEXT: Record<string, string> = {
  confirmed: 'Booking confirmed',
  checked_in: 'Checked in — enjoy your game!',
  no_show: 'Marked as no-show',
  cancelled: 'Booking cancelled',
  refunded: 'Booking cancelled and refunded to your wallet',
};

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) notFound();
  const turf = db.turfs.find((t) => t.id === booking.turfId);
  if (!turf) notFound();

  const p = booking.pricing;
  const due = p.total - booking.amountPaid;
  const advanceAtVenue = p.advance > 0 && p.advance < due ? p.advance : Math.max(0, due);
  const qrPayload = bookingQrPayload({ bookingCode: booking.code, venue: turf.name, date: booking.date, time: booking.timeLabel || formatSlotRange(booking.hour, booking.durationMinutes, booking.startMinute), name: booking.customerName, phone: `+91 ${maskPhone(booking.customerPhone)}`, total: p.total, advanceAtVenue, balanceAfterPlay: Math.max(0, due - advanceAtVenue) });
  const [svg, png] = await Promise.all([qrSvg(qrPayload), qrPng(qrPayload)]);
  const calendarDate = booking.hour < parseHour(turf.openTime) ? addDays(booking.date, 1) : booking.date;
  const startsAt = `${calendarDate}T${String(booking.hour).padStart(2, '0')}:${String(booking.startMinute ?? 0).padStart(2, '0')}:00+05:30`;
  const active = booking.status === 'confirmed';
  const player = booking.playerId ? db.players.find((pl) => pl.id === booking.playerId) : undefined;
  const txns = player ? db.walletTxns.filter((t) => t.playerId === player.id).slice(-5).reverse() : [];
  const expectedCashback = active ? cashbackFor(db, booking) : 0;
  const s = db.settings;

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host') ?? 'localhost:3000'}`;
  const shareUrl = player ? `${origin}/arenas/${turf.id}?ref=${player.referralCode}` : '';
  const shareText = player
    ? `Book venues and courts on OYUN! Use my code ${player.referralCode} on your first booking and get ₹${s.refereeReward} in your wallet after you play: ${shareUrl}`
    : '';

  const details = (
          <dl className={styles.summary}>
            <div><dt>Name</dt><dd>{booking.customerName}</dd></div>
            <div><dt>Phone</dt><dd>+91 {maskPhone(booking.customerPhone)}</dd></div>
            {booking.addOns.length > 0 && (
              <div><dt>Add-ons</dt><dd>{booking.addOns.map((a) => `${a.name} × ${a.qty}`).join(', ')}</dd></div>
            )}
            <div><dt>Total</dt><dd>₹{p.total}</dd></div>
            {booking.amountPaid > 0 && <div><dt>Paid</dt><dd>₹{booking.amountPaid}</dd></div>}
            {due > 0 && booking.status === 'confirmed' && (
              p.advance > 0 && p.advance < due ? (
                <>
                  <div><dt>Advance at the venue</dt><dd>₹{p.advance}</dd></div>
                  <div><dt>Balance after you play</dt><dd>₹{due - p.advance}</dd></div>
                </>
              ) : (
                <div><dt>Pay at venue</dt><dd>₹{due}</dd></div>
              )
            )}
          </dl>
  );

  return (
    <div className={`container ${styles.page}`}>
      <BackButton fallback="/bookings" />
      <div className={styles.card}>
        <header className={styles.ticketHeader}>
          <div className={styles.ticketTitleRow}>
          <h1 className={styles.turf}>{turf.name}</h1>
          <div className={`${styles.status} ${active || booking.status === 'checked_in' ? styles.ok : styles.off}`}>
            {active ? '✓ ' : ''}{STATUS_TEXT[booking.status]}
          </div>
          </div>
          <p className={styles.when}>
            <span>{formatDate(booking.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className={styles.ticketTime}>{booking.timeLabel || formatSlotRange(booking.hour, booking.durationMinutes, booking.startMinute)}{halfNote(booking.pitch, turf.halfNames)}</span>
          </p>
          <p className={styles.where}>Mangalore</p>
          {active && <BookingCountdown startsAt={startsAt} durationMinutes={booking.durationMinutes ?? 60} />}
        </header>

        <div className={`${styles.ticketBody} ${active ? styles.withQr : ''}`}>

          {active && (
            <div className={styles.qrBlock}>
              <div className={styles.qrMedia}>
              {/* QR content includes display details; check-in validates the stored booking. */}
              <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />
              <div className={styles.code}>{booking.code}</div>
              <p className={styles.hint}>Show this QR code at the gate to check in.</p>
              </div>
            </div>
          )}

          {!active && details}
        </div>

        <div className={styles.actionGroup}>
          {active && <a href={png} download={`OYUN-${booking.code}.png`} className={styles.ticketButton}><BookingActionIcon action="download" />Download QR</a>}
          <Link href={`/bookings/${booking.id}/invoice`} className={styles.ticketButton}><BookingActionIcon action="invoice" />View invoice</Link>
        </div>
        {booking.status === 'checked_in' && (
          <ReviewForm
            bookingId={booking.id}
            turfName={turf.name}
            needsPhone={!booking.accountId}
            existing={booking.review ? { rating: booking.review.rating, comment: booking.review.comment } : null}
          />
        )}
        {player && (player.walletBalance > 0 || s.cashbackEnabled || s.referralEnabled) && (
          <div className={styles.rewards}>
            <h2 className={styles.rewardsTitle}>Your OYUN wallet</h2>
            <div className={styles.walletBalance}>₹{player.walletBalance}</div>
            {booking.cashback ? (
              <p className={styles.rewardLine}>💰 ₹{booking.cashback} cashback from this game was added to your wallet.</p>
            ) : expectedCashback > 0 ? (
              <p className={styles.rewardLine}>💰 You&apos;ll get ₹{expectedCashback} cashback when you check in at the venue.</p>
            ) : null}
            {player.referredBy && !player.referralRewarded && s.referralEnabled && (
              <p className={styles.rewardLine}>🎁 ₹{s.refereeReward} referral bonus unlocks after your first game.</p>
            )}

            {txns.length > 0 && (
              <ul className={styles.txns}>
                {txns.map((t) => (
                  <li key={t.id}>
                    <span>
                      {WALLET_TXN_LABELS[t.type]}
                      <span className={styles.txnDate}>{formatDateTime(t.createdAt)}</span>
                    </span>
                    <span className={t.amount > 0 ? styles.credit : styles.debit}>{t.amount > 0 ? '+' : '−'}₹{Math.abs(t.amount)}</span>
                  </li>
                ))}
              </ul>
            )}

            {s.referralEnabled && (
              <div className={styles.referBox}>
                <div className={styles.referHead}>Invite friends, earn ₹{s.referrerReward}</div>
                <p className={styles.referText}>
                  Friends get ₹{s.refereeReward} and you get ₹{s.referrerReward} in your wallet after their first game.
                </p>
                <div className={styles.referCode}>{player.referralCode}</div>
                <a className="btn btn--primary btn--sm" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
                  Share on WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
