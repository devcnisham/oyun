import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { qrSvg } from '@/lib/qr';
import { getDb } from '@/lib/store';
import { formatDate, formatDateTime, formatSlotRange } from '@/lib/time';
import { WALLET_TXN_LABELS, cashbackFor } from '@/lib/wallet';
import styles from './page.module.css';

const STATUS_TEXT: Record<string, string> = {
  confirmed: 'Booking confirmed',
  checked_in: 'Checked in — enjoy your game!',
  no_show: 'Marked as no-show',
  cancelled: 'Booking cancelled',
  refunded: 'Booking cancelled and refunded to your wallet',
};

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) notFound();
  const turf = db.turfs.find((t) => t.id === booking.turfId);
  if (!turf) notFound();

  const svg = await qrSvg(booking.code);
  const p = booking.pricing;
  const due = p.total - booking.amountPaid;
  const active = booking.status === 'confirmed';
  const player = booking.playerId ? db.players.find((pl) => pl.id === booking.playerId) : undefined;
  const txns = player ? db.walletTxns.filter((t) => t.playerId === player.id).slice(-5).reverse() : [];
  const expectedCashback = active ? cashbackFor(db, booking) : 0;
  const s = db.settings;

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host') ?? 'localhost:3000'}`;
  const shareUrl = player ? `${origin}/arenas/${turf.id}?ref=${player.referralCode}` : '';
  const shareText = player
    ? `Book football turfs on OYUN! Use my code ${player.referralCode} on your first booking and get ₹${s.refereeReward} in your wallet after you play: ${shareUrl}`
    : '';

  return (
    <div className={`container ${styles.page}`}>
      <Link href="/" style={{display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500}}>
        <span style={{fontSize: 16}}>←</span> Back home
      </Link>
      <div className={styles.card}>
        <div className={`${styles.status} ${active || booking.status === 'checked_in' ? styles.ok : styles.off}`}>
          {active ? '✓ ' : ''}{STATUS_TEXT[booking.status]}
        </div>
        <h1 className={styles.turf}>{turf.name}</h1>
        <p className={styles.when}>
          {formatDate(booking.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {formatSlotRange(booking.hour)}
        </p>
        <p className={styles.where}>{turf.location}</p>

        {active && (
          <div className={styles.qrBlock}>
            {/* QR markup is generated server-side from our own booking code */}
            <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />
            <div className={styles.code}>{booking.code}</div>
            <p className={styles.hint}>Show this QR code at the gate to check in.</p>
          </div>
        )}

        <dl className={styles.summary}>
          <div><dt>Name</dt><dd>{booking.customerName}</dd></div>
          <div><dt>Phone</dt><dd>+91 {booking.customerPhone}</dd></div>
          {booking.addOns.length > 0 && (
            <div><dt>Add-ons</dt><dd>{booking.addOns.map((a) => `${a.name} × ${a.qty}`).join(', ')}</dd></div>
          )}
          <div><dt>Total</dt><dd>₹{p.total}</dd></div>
          <div><dt>Paid</dt><dd>₹{booking.amountPaid}</dd></div>
          {due > 0 && booking.status === 'confirmed' && <div><dt>Pay at venue</dt><dd>₹{due}</dd></div>}
        </dl>

        <div className={styles.actions}>
          <Link href={`/bookings/${booking.id}/invoice`} className="btn btn--secondary btn--sm">View invoice</Link>
          <a
            className="btn btn--secondary btn--sm"
            href={`https://maps.google.com/?q=${encodeURIComponent(`${turf.name} ${turf.location}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            Directions
          </a>
          <Link href={`/arenas/${turf.id}`} className="btn btn--primary btn--sm">Book again</Link>
        </div>
        {player && (
          <div className={styles.rewards}>
            <h2 className={styles.rewardsTitle}>Your OYUN wallet</h2>
            <div className={styles.walletBalance}>₹{player.walletBalance}</div>
            {booking.cashback ? (
              <p className={styles.rewardLine}>💰 ₹{booking.cashback} cashback from this game was added to your wallet.</p>
            ) : expectedCashback > 0 ? (
              <p className={styles.rewardLine}>💰 You&apos;ll get ₹{expectedCashback} cashback when you check in at the turf.</p>
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

        <p className={styles.note}>
          Save this page — it&apos;s your ticket. Need to cancel? Call the turf at {turf.phone}.
        </p>
      </div>
    </div>
  );
}
