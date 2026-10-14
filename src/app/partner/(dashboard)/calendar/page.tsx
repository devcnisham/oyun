import Link from 'next/link';
import { PageHeader, dash } from '@/components/dash/ui';
import {
  buildDay,
  buildWeek,
  weekStart,
  type CalendarBooking,
} from '@/lib/calendar';
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

function cellClass(c: { state: string; bookings: CalendarBooking[] }) {
  if (c.state !== 'booked') return CELL_CLASS[c.state] ?? '';
  const statuses = c.bookings.map((b) => b.status);
  if (statuses.length > 0 && statuses.every((s) => s === 'checked_in')) return dash.calChecked;
  if (statuses.length > 0 && statuses.every((s) => s === 'no_show')) return dash.calNoShow;
  return dash.calBooked;
}

function CalendarCellContent({ cell }: { cell: { state: string; bookings: CalendarBooking[]; blockReason: string | null } }) {
  return (
    <>
      {cell.bookings.map((b) => (
        <span
          key={b.id}
          className={dash.calName}
          title={`${b.name} · ${b.phone} · ${b.code} · ${b.status.replace('_', ' ')}`}
        >
          {b.name}
          {b.part !== 'full' ? ` · ${b.part}` : ''}
          {b.source === 'walk_in' ? ' · walk-in' : ''}
        </span>
      ))}
      {cell.state === 'blocked' && (
        <span className={dash.calName} title={cell.blockReason ?? ''}>
          ⛔ {cell.blockReason}
        </span>
      )}
      {cell.state === 'held' && <span className={dash.muted}>Being booked…</span>}
    </>
  );
}

function CalendarLegend({ hint }: { hint: React.ReactNode }) {
  return (
    <div className={dash.calLegend}>
      <span><i className={`${dash.calDot} ${dash.calBooked}`} />Booked</span>
      <span><i className={`${dash.calDot} ${dash.calChecked}`} />Checked in</span>
      <span><i className={`${dash.calDot} ${dash.calNoShow}`} />No-show</span>
      <span><i className={`${dash.calDot} ${dash.calBlocked}`} />Blocked</span>
      <span><i className={`${dash.calDot} ${dash.calHeld}`} />Being booked</span>
      <span>{hint}</span>
    </div>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: 'day' | 'week'; date?: string; week?: string; court?: string }>;
}) {
  const ctx = await requirePartner('bookings');
  const params = await searchParams;
  const view = params.view === 'day' ? 'day' : 'week';
  const db = await getDb();
  const now = istNow();

  // Day view data
  const selectedDate = params.date && isValidDate(params.date) ? params.date : now.date;
  const dayView = buildDay(db, ctx.turf, selectedDate, now);

  // Week view data
  const weekStartParam = params.week && isValidDate(params.week) ? params.week : now.date;
  const start = weekStart(weekStartParam);
  const weekView = buildWeek(db, ctx.turf, start, now, params.court);
  const thisWeek = weekStart(now.date);

  return (
    <div className={dash.page}>
      <PageHeader
        title="Calendar"
        desc={`${ctx.turf.name}: day and week schedules across all courts and pitches.`}
      >
        <div className={dash.inline}>
          <Link
            href={`/partner/calendar?view=week${params.week ? `&week=${params.week}` : ''}${params.court ? `&court=${encodeURIComponent(params.court)}` : ''}`}
            className={`${dash.btn} ${dash.btnSm} ${view === 'week' ? '' : dash.btnSecondary}`}
          >
            Week view
          </Link>
          <Link
            href={`/partner/calendar?view=day&date=${selectedDate}`}
            className={`${dash.btn} ${dash.btnSm} ${view === 'day' ? '' : dash.btnSecondary}`}
          >
            Day view
          </Link>
          <Link href={`/partner/slots?date=${selectedDate}`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>
            Manage slots
          </Link>
        </div>
      </PageHeader>

      {view === 'day' ? (
        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <div className={dash.inline}>
              <Link
                href={`/partner/calendar?view=day&date=${addDays(selectedDate, -1)}`}
                className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}
              >
                ← Previous day
              </Link>
              <Link
                href={`/partner/calendar?view=day&date=${now.date}`}
                className={`${dash.btn} ${dash.btnSm} ${selectedDate === now.date ? '' : dash.btnSecondary}`}
              >
                Today
              </Link>
              <Link
                href={`/partner/calendar?view=day&date=${addDays(selectedDate, 1)}`}
                className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}
              >
                Next day →
              </Link>
            </div>
            <div>
              <h2 className={dash.cardTitle}>
                {formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                {dayView.isToday && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--primary, #059669)' }}>(Today)</span>}
              </h2>
              <div className={dash.muted} style={{ fontSize: 13, marginTop: 2 }}>
                {dayView.booked} booking{dayView.booked === 1 ? '' : 's'} across {dayView.courts.length} court{dayView.courts.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          <div className={dash.calWrap}>
            <table className={dash.calTable}>
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Time</th>
                  {dayView.courts.map((court) => {
                    const courtBooked = dayView.rows.reduce(
                      (count, row) =>
                        count +
                        (row.cells.find((c) => c.courtId === court.id)?.bookings.length ?? 0),
                      0
                    );
                    return (
                      <th key={court.id}>
                        <div>{court.name}</div>
                        <div className={dash.muted}>{courtBooked} booked</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {dayView.rows.map((row) => (
                  <tr key={row.hour}>
                    <td className={dash.calHour}>{row.timeLabel}</td>
                    {row.cells.map((cell) => (
                      <td key={cell.courtId} className={`${dash.calCell} ${cellClass(cell)}`}>
                        <CalendarCellContent cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CalendarLegend
            hint={
              <Link href={`/partner/slots?date=${selectedDate}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                Click here to block slots or book walk-ins.
              </Link>
            }
          />
        </div>
      ) : (
        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <div className={dash.inline}>
              <Link
                href={`/partner/calendar?view=week&week=${addDays(start, -7)}${params.court ? `&court=${encodeURIComponent(params.court)}` : ''}`}
                className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}
              >
                ← Previous
              </Link>
              <Link
                href={`/partner/calendar?view=week${params.court ? `&court=${encodeURIComponent(params.court)}` : ''}`}
                className={`${dash.btn} ${dash.btnSm} ${start === thisWeek ? '' : dash.btnSecondary}`}
              >
                This week
              </Link>
              <Link
                href={`/partner/calendar?view=week&week=${addDays(start, 7)}${params.court ? `&court=${encodeURIComponent(params.court)}` : ''}`}
                className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}
              >
                Next →
              </Link>
            </div>
            <div>
              <h2 className={dash.cardTitle}>
                {formatDate(start)} – {formatDate(addDays(start, 6))}
              </h2>
              <div className={dash.muted} style={{ fontSize: 13, marginTop: 2 }}>
                {weekView.days.reduce((n, d) => n + d.booked, 0)} bookings this week
              </div>
            </div>
          </div>

          {weekView.courts.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 0 12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, alignSelf: 'center', marginRight: 4, color: 'var(--text-secondary)' }}>
                Filter court:
              </span>
              <Link
                href={`/partner/calendar?view=week&week=${start}`}
                className={`${dash.btn} ${dash.btnSm} ${!params.court || params.court === 'all' ? '' : dash.btnSecondary}`}
              >
                All courts ({weekView.courts.length})
              </Link>
              {weekView.courts.map((c) => (
                <Link
                  key={c.id}
                  href={`/partner/calendar?view=week&week=${start}&court=${encodeURIComponent(c.id)}`}
                  className={`${dash.btn} ${dash.btnSm} ${params.court === c.id || params.court === c.name ? '' : dash.btnSecondary}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          <div className={dash.calWrap}>
            <table className={dash.calTable}>
              <thead>
                <tr>
                  <th />
                  {weekView.days.map((d) => (
                    <th key={d.date} className={d.isToday ? dash.calToday : ''}>
                      <Link href={`/partner/calendar?view=day&date=${d.date}`}>
                        {d.isToday ? 'Today' : formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                      </Link>
                      <div className={dash.muted}>{d.booked} booked</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekView.hours.map((hour) => (
                  <tr key={hour}>
                    <td className={dash.calHour}>{formatSlotRange(hour)}</td>
                    {weekView.days.map((d) => {
                      const c = d.cells.find((x) => x.hour === hour)!;
                      return (
                        <td key={d.date} className={`${dash.calCell} ${cellClass(c)}`}>
                          <CalendarCellContent cell={c} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CalendarLegend hint="Click a day header to switch to day view or manage slots." />
        </div>
      )}
    </div>
  );
}
