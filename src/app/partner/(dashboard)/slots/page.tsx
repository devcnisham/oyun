import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { PageHeader, dash } from '@/components/dash/ui';
import DateJump from './DateJump';
import styles from './slots.module.css';
import { requirePartner } from '@/lib/partner-auth';
import { blockRange, blockSlot, unblockSlot } from '@/lib/partner-actions';
import { getSlots, turfHours } from '@/lib/pricing';
import { getDb } from '@/lib/store';
import { addDays, dayOfWeek, formatDate, formatHour, formatSlotRange, isValidDate, istNow } from '@/lib/time';

export default async function SlotsPage({ searchParams }: { searchParams: Promise<{ date?: string; view?: string }> }) {
  const ctx = await requirePartner('slots');
  const { date: rawDate, view: rawView } = await searchParams;
  const view: 'day' | 'week' | 'month' = rawView === 'week' || rawView === 'month' ? rawView : 'day';
  const db = await getDb();
  const now = istNow();
  const date = rawDate && isValidDate(rawDate) ? rawDate : now.date;

  const slots = getSlots(db, ctx.turf, date, now);
  const bookings = db.bookings.filter((b) => b.turfId === ctx.turf.id && b.date === date && ['confirmed', 'checked_in', 'no_show'].includes(b.status));
  const blocks = db.blocks.filter((b) => b.turfId === ctx.turf.id && b.date === date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(now.date, i));

  // Range views: one status per slot per day
  type Cell = { hour: number; label: string; status: 'free' | 'booked' | 'blocked' | 'past' };
  const statusFor = (d: string): Cell[] => {
    const daySlots = getSlots(db, ctx.turf, d, now);
    const dayBookings = db.bookings.filter((b) => b.turfId === ctx.turf.id && b.date === d && ['confirmed', 'checked_in', 'no_show'].includes(b.status));
    const dayBlocks = db.blocks.filter((b) => b.turfId === ctx.turf.id && b.date === d);
    return daySlots.map((s) => {
      const booked = dayBookings.some((b) => (b.hours && b.hours.length > 0 ? b.hours.includes(s.hour) : b.hour === s.hour));
      const blocked = dayBlocks.some((b) => b.hour === s.hour);
      const status: Cell['status'] = s.reason === 'past' ? 'past' : booked ? 'booked' : blocked ? 'blocked' : 'free';
      return { hour: s.hour, label: s.label || formatSlotRange(s.hour, s.durationMinutes, s.minute), status };
    });
  };
  const monday = (d: string) => addDays(d, -((dayOfWeek(d) + 6) % 7));
  const shiftMonth = (d: string, delta: number) => {
    const [y, m] = d.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-01`;
  };
  const step = (dir: 1 | -1) => (view === 'month' ? shiftMonth(date, dir) : addDays(date, dir * (view === 'week' ? 7 : 1)));
  const href = (d: string, v: string = view) => `/partner/slots?view=${v}&date=${d}`;

  const weekDays = view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(monday(date), i)) : [];
  const weekData = weekDays.map((d) => statusFor(d));
  const weekHours = Array.from(new Map(weekData.flat().map((c) => [c.hour, c.label])).entries()).sort((a, b) => a[0] - b[0]);

  const monthStart = `${date.slice(0, 8)}01`;
  const monthEnd = shiftMonth(date, 1);
  const monthDays: string[] = [];
  if (view === 'month') for (let d = monthStart; d < monthEnd; d = addDays(d, 1)) monthDays.push(d);
  const monthLead = view === 'month' ? (dayOfWeek(monthStart) + 6) % 7 : 0;
  const heading =
    view === 'month' ? formatDate(date, { month: 'long', year: 'numeric' })
    : view === 'week' ? `${formatDate(weekDays[0] ?? date)} – ${formatDate(weekDays[6] ?? date)}`
    : formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={dash.page}>
      <PageHeader title="Manage slots" desc="Block slots for maintenance or phone bookings. Blocked slots disappear from the public booking page." />

      <div className={dash.card}>
        <div className={styles.datePanel}>
          <div className={styles.toolbar}>
            <div className={styles.segment} role="tablist" aria-label="Calendar view">
              {(['day', 'week', 'month'] as const).map((v) => (
                <Link key={v} href={href(date, v)} role="tab" aria-selected={view === v} className={`${styles.segBtn} ${view === v ? styles.segActive : ''}`}>
                  {v === 'day' ? 'Day' : v === 'week' ? 'Week' : 'Month'}
                </Link>
              ))}
            </div>
            <div className={styles.dateRow}>
              <Link href={href(step(-1))} className={styles.stepBtn} aria-label={`Previous ${view}`}>‹</Link>
              <DateJump date={date} view={view} className={styles.dateInput} />
              <Link href={href(step(1))} className={styles.stepBtn} aria-label={`Next ${view}`}>›</Link>
              <Link href={href(now.date)} className={styles.todayBtn}>Today</Link>
            </div>
          </div>
          {view === 'day' && (
            <div className={styles.tiles} role="list" aria-label="Pick a day">
              {days.map((d, i) => (
                <Link key={d} href={href(d, 'day')} role="listitem" className={`${styles.tile} ${d === date ? styles.tileActive : ''}`}>
                  <span className={styles.tileDow}>{i === 0 ? 'Today' : formatDate(d, { weekday: 'short' })}</span>
                  <span className={styles.tileNum}>{Number(d.slice(8))}</span>
                  <span className={styles.tileMon}>{formatDate(d, { month: 'short' })}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <details className={`${dash.card} ${styles.bulk}`}>
        <summary className={styles.bulkSummary}>
          <span>
            <strong>Bulk block</strong>
            <small>Block a date range, a time window, or the same days every week (maintenance, coaching, events).</small>
          </span>
          <span className={styles.bulkChevron} aria-hidden>▾</span>
        </summary>
        <ActionForm action={blockRange}>
          <div className={styles.bulkGrid}>
            <label>
              <span>From date</span>
              <input type="date" name="from" required defaultValue={date} className={dash.input} />
            </label>
            <label>
              <span>To date</span>
              <input type="date" name="to" required defaultValue={date} className={dash.input} />
            </label>
            <label>
              <span>From time</span>
              <select name="hourFrom" defaultValue={turfHours(ctx.turf)[0]} className={dash.input}>
                {turfHours(ctx.turf).map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
              </select>
            </label>
            <label>
              <span>Until</span>
              <select name="hourTo" defaultValue={(turfHours(ctx.turf).at(-1) ?? 22) + 1} className={dash.input}>
                {turfHours(ctx.turf).map((h) => <option key={h} value={h + 1}>{formatHour(h + 1)}</option>)}
              </select>
            </label>
          </div>
          <fieldset className={styles.weekdays}>
            <legend>Only on these days (leave empty for every day)</legend>
            {[['Mon', 1], ['Tue', 2], ['Wed', 3], ['Thu', 4], ['Fri', 5], ['Sat', 6], ['Sun', 0]].map(([n, v]) => (
              <label key={n} className={styles.dayPick}>
                <input type="checkbox" name="weekday" value={v} />
                <span>{n}</span>
              </label>
            ))}
          </fieldset>
          <div className={styles.bulkFoot}>
            <input name="reason" required maxLength={120} placeholder="Reason (e.g. coaching batch, tournament)" list="block-reasons" aria-label="Reason" className={dash.input} />
            <button className={`${dash.btn}`}>Block slots</button>
          </div>
        </ActionForm>
      </details>

      <datalist id="block-reasons">
        <option value="Phone / offline booking" />
        <option value="Heavy rain / weather" />
        <option value="Turf maintenance" />
        <option value="Private tournament / event" />
        <option value="Coaching batch" />
        <option value="Front desk hold" />
      </datalist>

      <div className={dash.card}>
        <div className={styles.slotsHead}>
          <h2 className={styles.dayTitle}>{heading}</h2>
          {view === 'day' && (
            <span className={styles.summary}>
              {slots.filter((x) => x.reason !== 'past' && !bookings.some((b) => (b.hours && b.hours.length > 0 ? b.hours.includes(x.hour) : b.hour === x.hour)) && !blocks.some((b) => b.hour === x.hour)).length} open · {bookings.length} booked · {blocks.length} blocked
            </span>
          )}
        </div>
        {view !== 'day' && (
          <div className={styles.legend}>
            <span><i className={`${styles.dot} ${styles.free}`} /> Free</span>
            <span><i className={`${styles.dot} ${styles.booked}`} /> Booked</span>
            <span><i className={`${styles.dot} ${styles.blocked}`} /> Blocked</span>
            <span><i className={`${styles.dot} ${styles.past}`} /> Over</span>
          </div>
        )}

        {view === 'week' && (
          <div className={styles.weekWrap}>
            <table className={styles.week}>
              <thead>
                <tr>
                  <th />
                  {weekDays.map((d) => (
                    <th key={d} className={d === now.date ? styles.todayCol : ''}>
                      <Link href={href(d, 'day')}>{formatDate(d, { weekday: 'short', day: 'numeric' })}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekHours.map(([hour, label]) => (
                  <tr key={hour}>
                    <th scope="row">{label}</th>
                    {weekData.map((cells, i) => {
                      const c = cells.find((x) => x.hour === hour);
                      return (
                        <td key={weekDays[i]}>
                          {c ? (
                            <Link href={href(weekDays[i], 'day')} className={`${styles.cell} ${styles[c.status]}`} aria-label={`${formatDate(weekDays[i])} ${label}: ${c.status}`}>
                              {c.status === 'free' ? '' : c.status === 'booked' ? 'Booked' : c.status === 'blocked' ? 'Blocked' : '–'}
                            </Link>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'month' && (
          <div className={styles.month}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((n) => (
              <div key={n} className={styles.monthHead}>{n}</div>
            ))}
            {Array.from({ length: monthLead }, (_, i) => <div key={`lead-${i}`} />)}
            {monthDays.map((d) => {
              const cells = statusFor(d);
              const count = (st: Cell['status']) => cells.filter((c) => c.status === st).length;
              const allPast = cells.length > 0 && cells.every((c) => c.status === 'past');
              return (
                <Link key={d} href={href(d, 'day')} className={`${styles.day} ${d === now.date ? styles.dayToday : ''} ${allPast ? styles.dayPast : ''}`}>
                  <span className={styles.dayNum}>{Number(d.slice(8))}</span>
                  <span className={styles.dayStats}>
                    {count('booked') > 0 && <span className={`${styles.pill} ${styles.booked}`}>{count('booked')} booked</span>}
                    {count('blocked') > 0 && <span className={`${styles.pill} ${styles.blocked}`}>{count('blocked')} blocked</span>}
                    {!allPast && <span className={`${styles.pill} ${styles.free}`}>{count('free')} free</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {view === 'day' && (
        <div className={styles.grid}>
          {slots.map((s) => {
            // A pitch that splits can have two bookings in one hour (half A and half B)
            const hourBookings = bookings.filter((b) => (b.hours && b.hours.length > 0 ? b.hours.includes(s.hour) : b.hour === s.hour));
            const booking = hourBookings[0];
            const block = blocks.find((b) => b.hour === s.hour);
            const status = s.reason === 'past' ? 'past' : booking ? 'booked' : block ? 'blocked' : 'free';
            const badge = { past: 'Over', booked: 'Booked', blocked: 'Blocked', free: 'Open' }[status];
            return (
              <div key={s.hour} className={`${styles.slotTile} ${styles[`slot_${status}`]}`}>
                <div className={styles.slotTop}>
                  <span className={styles.slotTime}>{s.label || formatSlotRange(s.hour, s.durationMinutes, s.minute)}</span>
                  <span className={`${styles.badge} ${styles[status]}`}>{badge}</span>
                </div>
                <div className={styles.slotPrice}>
                  ₹{s.price}
                  {s.tags.length > 0 && <span className={styles.slotTag}>{s.tags.join(', ')}</span>}
                </div>
                {booking ? (
                  hourBookings.map((b) => (
                    <span key={b.id} className={styles.slotNote}>
                      {b.customerName}{b.source === 'walk_in' ? ' (walk-in)' : ''}{b.pitch && b.pitch !== 'full' ? ` · half ${b.pitch}` : ''}
                    </span>
                  ))
                ) : block ? (
                  <>
                    <span className={styles.slotNote}>{block.reason}</span>
                    {s.reason !== 'past' && (
                      <ActionForm action={unblockSlot} inline>
                        <input type="hidden" name="blockId" value={block.id} />
                        <button className={`${dash.btn} ${dash.btnSecondary}`}>Reopen slot</button>
                      </ActionForm>
                    )}
                  </>
                ) : s.reason === 'past' ? null : (
                  <details className={styles.blockBox}>
                    <summary>Block this slot</summary>
                    <ActionForm action={blockSlot}>
                      <input type="hidden" name="date" value={date} />
                      <input type="hidden" name="hour" value={s.hour} />
                      <input name="reason" aria-label="Reason for blocking" required placeholder="Reason (e.g. maintenance)" list="block-reasons" className={dash.input} />
                      <button className={`${dash.btn} ${dash.btnSecondary}`}>Confirm block</button>
                    </ActionForm>
                  </details>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
