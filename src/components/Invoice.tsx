import { rupees as inr } from '@/lib/format';
import { maskPhone } from '@/lib/phone';
import { gstSplit, halfNote } from '@/lib/pricing';
import { formatDate, formatDateTime, formatSlotRange } from '@/lib/time';
import type { Booking, Partner, PlatformSettings, Turf } from '@/lib/types';
import styles from './Invoice.module.css';

interface InvoiceProps {
  booking: Booking;
  turf: Turf;
  partner: Partner | null;
  settings: PlatformSettings;
  hidePhone?: boolean; // for the public invoice link: show only the first and last two digits
}

// Tax invoice issued by the turf (supplier) to the player. Prices include GST.
export default function Invoice({ booking, turf, partner, settings, hidePhone = false }: InvoiceProps) {
  const p = booking.pricing;
  const gst = gstSplit(p.total, settings.gstPercent);
  const business = partner?.business;
  const lines = [
    { label: `Turf booking — ${formatDate(booking.date, { day: 'numeric', month: 'short', year: 'numeric' })}, ${formatSlotRange(booking.hour)}${halfNote(booking.pitch)}`, amount: p.slotPrice },
    ...(p.offer ? [p.offer] : []),
    ...(p.promo ? [p.promo] : []),
    ...booking.addOns.map((a) => ({ label: `${a.name} × ${a.qty}`, amount: a.price * a.qty })),
    ...(p.walletDeduction ? [{ label: 'Paid from OYUN wallet', amount: -p.walletDeduction }] : []),
  ];

  return (
    <article className={styles.invoice}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{business?.gstin ? 'Tax Invoice' : 'Booking Receipt'}</h1>
          <p className={styles.meta}>Invoice no. INV-{booking.code.slice(3)}</p>
          <p className={styles.meta}>Issued {formatDateTime(booking.createdAt)}</p>
        </div>
        <div className={styles.brand}>OYUN</div>
      </header>

      <section className={styles.parties}>
        <div>
          <h2 className={styles.partyLabel}>From</h2>
          <p className={styles.partyName}>{business?.legalName || turf.ownerName}</p>
          <p>{turf.name}</p>
          <p>{business?.address || turf.location}</p>
          {business?.gstin && <p>GSTIN: {business.gstin}</p>}
          <p>State: Karnataka (State Code 29)</p>
        </div>
        <div>
          <h2 className={styles.partyLabel}>Billed to</h2>
          <p className={styles.partyName}>{booking.customerName}</p>
          <p>+91 {hidePhone ? maskPhone(booking.customerPhone) : booking.customerPhone}</p>
          <p>Booking code: {booking.code}</p>
          <p>Place of supply: Karnataka (29)</p>
        </div>
      </section>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Description</th>
            <th className={styles.num}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td>{l.label}</td>
              <td className={styles.num}>{l.amount < 0 ? `−${inr(-l.amount)}` : inr(l.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {business?.gstin && settings.gstPercent > 0 && (
            <>
              <tr>
                <td>Taxable value</td>
                <td className={styles.num}>{inr(gst.taxable)}</td>
              </tr>
              <tr>
                <td>CGST @ {settings.gstPercent / 2}%</td>
                <td className={styles.num}>{inr(gst.cgst)}</td>
              </tr>
              <tr>
                <td>SGST @ {settings.gstPercent / 2}%</td>
                <td className={styles.num}>{inr(gst.sgst)}</td>
              </tr>
            </>
          )}
          <tr className={styles.total}>
            <td>Total{business?.gstin ? ' (incl. GST)' : ''}</td>
            <td className={styles.num}>{inr(p.total)}</td>
          </tr>
          <tr>
            <td>{booking.paymentMode === 'venue' ? 'Paid at venue' : `Paid ${booking.paymentMode === 'advance' ? '(advance)' : `(${booking.paymentMode})`}`}</td>
            <td className={styles.num}>{inr(booking.amountPaid)}</td>
          </tr>
          {booking.status !== 'checked_in' && p.total - booking.amountPaid > 0 && (
            <tr>
              <td>Balance due at venue</td>
              <td className={styles.num}>{inr(p.total - booking.amountPaid)}</td>
            </tr>
          )}
        </tfoot>
      </table>

      <footer className={styles.footer}>
        {business?.gstin ? 'SAC 999652 — Sports and recreational services. ' : 'This turf has not added a GSTIN; this is a payment receipt, not a tax invoice. '}
        Questions? {settings.supportEmail}{settings.supportPhone ? ` · ${settings.supportPhone}` : ''}
      </footer>
    </article>
  );
}
