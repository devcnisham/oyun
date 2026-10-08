import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, Stat, dash, inr } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { checkInBooking, markNoShow } from '@/lib/partner-actions';
import { getDb } from '@/lib/store';
import { addDays, formatDate, formatDateTime, formatSlotRange, istNow } from '@/lib/time';
import CheckInDesk from './CheckInDesk';
import { halfNote } from '@/lib/pricing';

export default async function CheckInPage() {
  const ctx = await requirePartner('checkin');
  const db = await getDb();
  const now = istNow();
  const turfBookings = db.bookings.filter((b) => b.turfId === ctx.turf.id);

  const today = turfBookings.filter((b) => b.date === now.date && ['confirmed', 'checked_in', 'no_show'].includes(b.status)).sort((a, b) => a.hour - b.hour);
  // Confirmed bookings whose slot already started and nobody checked in
  const pendingNoShows = turfBookings
    .filter((b) => b.status === 'confirmed' && (b.date < now.date || (b.date === now.date && b.hour <= now.hour)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour);
  const last30 = turfBookings.filter((b) => b.date >= addDays(now.date, -30) && b.date < now.date);
  const noShows30 = last30.filter((b) => b.status === 'no_show');
  const attended30 = last30.filter((b) => b.status === 'checked_in').length;

  // Players who skipped more than once recently
  const repeat = Object.values(
    noShows30.reduce<Record<string, { name: string; phone: string; count: number }>>((acc, b) => {
      acc[b.customerPhone] ??= { name: b.customerName, phone: b.customerPhone, count: 0 };
      acc[b.customerPhone].count++;
      return acc;
    }, {})
  ).filter((p) => p.count > 1).sort((a, b) => b.count - a.count);

  return (
    <div className={dash.page}>
      <PageHeader title="Check-in desk" desc="Scan the player's QR code or type their booking code at the gate." />

      <div className={dash.card}>
        <CheckInDesk />
      </div>

      <div className={dash.stats}>
        <Stat label="Today's bookings" value={today.length} />
        <Stat label="Checked in today" value={today.filter((b) => b.status === 'checked_in').length} />
        <Stat label="No-shows (30 days)" value={noShows30.length} hint={`${attended30 + noShows30.length ? Math.round((noShows30.length / (attended30 + noShows30.length)) * 100) : 0}% of bookings`} />
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Today — {formatDate(now.date, { weekday: 'long', day: 'numeric', month: 'long' })}</h2></div>
        {today.length === 0 ? (
          <p className={dash.empty}>No bookings today.</p>
        ) : (
          <div className={dash.tableWrap}>
            <table className={dash.table}>
              <thead><tr><th>Slot</th><th>Player</th><th>Code</th><th>Status</th><th className={dash.num}>Due at venue</th><th></th></tr></thead>
              <tbody>
                {today.map((b) => {
                  const started = b.hour <= now.hour;
                  return (
                    <tr key={b.id}>
                      <td className={dash.strong}>{formatSlotRange(b.hour)}{halfNote(b.pitch)}</td>
                      <td>{b.customerName}<div className={dash.muted}>{b.customerPhone}</div></td>
                      <td className={dash.muted}>{b.code}</td>
                      <td>
                        <Badge status={b.status} />
                        {b.checkedInAt && <div className={dash.muted}>{formatDateTime(b.checkedInAt)}</div>}
                      </td>
                      <td className={dash.num}>{b.status === 'confirmed' ? inr(b.pricing.total - b.amountPaid) : '—'}</td>
                      <td>
                        {b.status === 'confirmed' && (
                          <div className={dash.inline}>
                            <ActionForm action={checkInBooking} inline>
                              <input type="hidden" name="bookingId" value={b.id} />
                              <button className={`${dash.btn} ${dash.btnSm}`}>Check in</button>
                            </ActionForm>
                            {started && (
                              <ActionForm action={markNoShow} inline>
                                <input type="hidden" name="bookingId" value={b.id} />
                                <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>No-show</button>
                              </ActionForm>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={dash.grid2}>
        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <div>
              <h2 className={dash.cardTitle}>Missed check-ins</h2>
              <p className={dash.cardDesc}>Slots that started without a check-in. Mark them so no-show stats stay accurate.</p>
            </div>
          </div>
          {pendingNoShows.length === 0 ? (
            <p className={dash.empty}>All caught up.</p>
          ) : (
            <div className={dash.list}>
              {pendingNoShows.slice(0, 15).map((b) => (
                <div key={b.id} className={dash.listItem}>
                  <div>
                    <div className={dash.strong}>{b.customerName}</div>
                    <div className={dash.muted}>{formatDate(b.date)} · {b.timeLabel}{halfNote(b.pitch)}</div>
                  </div>
                  <ActionForm action={markNoShow} inline>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Mark no-show</button>
                  </ActionForm>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <div>
              <h2 className={dash.cardTitle}>Repeat no-shows (30 days)</h2>
              <p className={dash.cardDesc}>Consider asking these players for full payment upfront.</p>
            </div>
          </div>
          {repeat.length === 0 ? (
            <p className={dash.empty}>No repeat no-shows.</p>
          ) : (
            <div className={dash.list}>
              {repeat.map((p) => (
                <div key={p.phone} className={dash.listItem}>
                  <div>
                    <div className={dash.strong}>{p.name}</div>
                    <div className={dash.muted}>{p.phone}</div>
                  </div>
                  <Badge status="no_show" label={`${p.count} no-shows`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
