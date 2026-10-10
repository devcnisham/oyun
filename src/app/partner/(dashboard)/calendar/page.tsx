import Link from 'next/link';
import { PageHeader, dash } from '@/components/dash/ui';
import { buildWeek, weekStart, type CalendarCell } from '@/lib/calendar';
import { requirePartner } from '@/lib/partner-auth';
import { getDb } from '@/lib/store';
import { addDays, formatDate, formatSlotRange, isValidDate, istNow } from '@/lib/time';

const CELL_CLASS: Record<string, string> = {
  free: '',
  past: dash.calPast,
  booked: dash.calBooked,
  blocked: dash.calBlocked,
  held: dash.calHeld,
};

function cellClass(c: CalendarCell) {
  if (c.state !== 'booked') return CELL_CLASS[c.state];
  const statuses = c.bookings.map((b) => b.status);
  if (statuses.every((s) => s === 'checked_in')) return dash.calChecked;
  if (statuses.every((s) => s === 'no_show')) return dash.calNoShow;
  return dash.calBooked;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const ctx = await requirePartner('bookings');
  const { week: raw } = await searchParams;
  const db = await getDb();
  const now = istNow();
  const start = weekStart(raw && isValidDate(raw) ? raw : now.date);
  const { hours, days } = buildWeek(db, ctx.turf, start, now);
  const total = days.reduce((n, d) => n + d.booked, 0);
  const thisWeek = weekStart(now.date);

  return (
    <div className={dash.page}>
      <PageHeader title="Calendar" desc={`${ctx.turf.name}: the week at a glance. ${total} booking${total === 1 ? '' : 's'} this week. Split pitches show each half.`} />

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <div className={dash.inline}>
            <Link href={`/partner/calendar?week=${addDays(start, -7)}`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>← Previous</Link>
            <Link href="/partner/calendar" className={`${dash.btn} ${dash.btnSm} ${start === thisWeek ? '' : dash.btnSecondary}`}>This week</Link>
            <Link href={`/partner/calendar?week=${addDays(start, 7)}`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Next →</Link>
          </div>
          <h2 className={dash.cardTitle}>{formatDate(start)} – {formatDate(addDays(start, 6))}</h2>
        </div>

        <div className={dash.calWrap}>
          <table className={dash.calTable}>
            <thead>
              <tr>
                <th />
                {days.map((d) => (
                  <th key={d.date} className={d.isToday ? dash.calToday : ''}>
                    <Link href={`/partner/slots?date=${d.date}`}>{d.isToday ? 'Today' : formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</Link>
                    <div className={dash.muted}>{d.booked} booked</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className={dash.calHour}>{formatSlotRange(hour)}</td>
                  {days.map((d) => {
                    const c = d.cells.find((x) => x.hour === hour)!;
                    return (
                      <td key={d.date} className={`${dash.calCell} ${cellClass(c)}`}>
                        {c.bookings.map((b) => (
                          <span key={b.id} className={dash.calName} title={`${b.name} · ${b.phone} · ${b.code} · ${b.status.replace('_', ' ')}`}>
                            {b.name}{b.part !== 'full' ? ` · ${b.part}` : ''}{b.source === 'walk_in' ? ' · walk-in' : ''}
                          </span>
                        ))}
                        {c.state === 'blocked' && <span className={dash.calName} title={c.blockReason ?? ''}>⛔ {c.blockReason}</span>}
                        {c.state === 'held' && <span className={dash.muted}>Being booked…</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={dash.calLegend}>
          <span><i className={`${dash.calDot} ${dash.calBooked}`} />Booked</span>
          <span><i className={`${dash.calDot} ${dash.calChecked}`} />Checked in</span>
          <span><i className={`${dash.calDot} ${dash.calNoShow}`} />No-show</span>
          <span><i className={`${dash.calDot} ${dash.calBlocked}`} />Blocked</span>
          <span><i className={`${dash.calDot} ${dash.calHeld}`} />Being booked</span>
          <span>Click a day to block or reopen slots.</span>
        </div>
      </div>
    </div>
  );
}
