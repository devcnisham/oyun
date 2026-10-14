import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { PageHeader, dash } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { blockSlot, unblockSlot } from '@/lib/partner-actions';
import { getSlots } from '@/lib/pricing';
import { getDb } from '@/lib/store';
import { addDays, formatDate, formatSlotRange, isValidDate, istNow } from '@/lib/time';

export default async function SlotsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const ctx = await requirePartner('slots');
  const { date: rawDate } = await searchParams;
  const db = await getDb();
  const now = istNow();
  const date = rawDate && isValidDate(rawDate) ? rawDate : now.date;

  const slots = getSlots(db, ctx.turf, date, now);
  const bookings = db.bookings.filter((b) => b.turfId === ctx.turf.id && b.date === date && ['confirmed', 'checked_in', 'no_show'].includes(b.status));
  const blocks = db.blocks.filter((b) => b.turfId === ctx.turf.id && b.date === date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(now.date, i));

  return (
    <div className={dash.page}>
      <PageHeader title="Manage slots" desc="Block slots for maintenance or phone bookings. Blocked slots disappear from the public booking page." />

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <div className={dash.inline}>
            {days.map((d, i) => (
              <Link
                key={d}
                href={`/partner/slots?date=${d}`}
                className={`${dash.btn} ${dash.btnSm} ${d === date ? '' : dash.btnSecondary}`}
              >
                {i === 0 ? 'Today' : formatDate(d)}
              </Link>
            ))}
          </div>
          <form className={dash.inline}>
            <input type="date" name="date" aria-label="Date" defaultValue={date} className={dash.input} />
            <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Go</button>
          </form>
        </div>

        <h2 className={dash.cardTitle} style={{ marginBottom: 12 }}>{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>

        <div className={dash.slotGrid}>
          {slots.map((s) => {
            // A pitch that splits can have two bookings in one hour (half A and half B)
            const hourBookings = bookings.filter((b) => (b.hours && b.hours.length > 0 ? b.hours.includes(s.hour) : b.hour === s.hour));
            const booking = hourBookings[0];
            const block = blocks.find((b) => b.hour === s.hour);
            const cls = s.reason === 'past' ? dash.slotPast : booking ? dash.slotBooked : block ? dash.slotBlocked : dash.slotFree;
            return (
              <div key={s.hour} className={`${dash.slot} ${cls}`}>
                <span className={dash.slotTime}>{s.label || formatSlotRange(s.hour, s.durationMinutes, s.minute)}</span>
                <span>₹{s.price}{s.tags.length > 0 && <span className={dash.muted}> · {s.tags.join(', ')}</span>}</span>
                {booking ? (
                  hourBookings.map((b) => (
                    <span key={b.id}>
                      📅 {b.customerName}{b.source === 'walk_in' ? ' (walk-in)' : ''}{b.pitch && b.pitch !== 'full' ? ` · half ${b.pitch}` : ''}
                    </span>
                  ))
                ) : block ? (
                  <>
                    <span>⛔ {block.reason}</span>
                    {s.reason !== 'past' && (
                      <ActionForm action={unblockSlot} inline>
                        <input type="hidden" name="blockId" value={block.id} />
                        <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Reopen</button>
                      </ActionForm>
                    )}
                  </>
                ) : s.reason === 'past' ? (
                  <span>Over</span>
                ) : (
                  <ActionForm action={blockSlot}>
                    <input type="hidden" name="date" value={date} />
                    <input type="hidden" name="hour" value={s.hour} />
                    <input name="reason" aria-label="Reason for blocking" required placeholder="Reason" className={dash.input} style={{ padding: '6px 8px', fontSize: 12 }} />
                    <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Block</button>
                  </ActionForm>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
