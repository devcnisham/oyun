import NavIcon from '@/components/dash/NavIcon';
import Link from 'next/link';
import { PageHeader, dash } from '@/components/dash/ui';
import { buildDayAcrossCourts, buildWeek, weekStart, type CalendarCell } from '@/lib/calendar';
import { requirePartner } from '@/lib/partner-auth';
import { getDb } from '@/lib/store';
import { addDays, formatDate, formatSlotRange, isValidDate, istNow } from '@/lib/time';
import styles from './calendar.module.css';

function stateClass(c: { state: string; bookings: { status: string }[] }) {
  if (c.state === 'booked') {
    const statuses = c.bookings.map((b) => b.status);
    if (statuses.every((s) => s === 'checked_in')) return styles.checked;
    if (statuses.every((s) => s === 'no_show')) return styles.noshow;
    return styles.booked;
  }
  return { free: styles.free, past: styles.past, blocked: styles.blocked, held: styles.held }[c.state] ?? styles.free;
}

function Legend() {
  return (
    <div className={styles.legend}>
      <span><i className={`${styles.dot} ${styles.booked}`} />Booked</span>
      <span><i className={`${styles.dot} ${styles.checked}`} />Checked in</span>
      <span><i className={`${styles.dot} ${styles.noshow}`} />No-show</span>
      <span><i className={`${styles.dot} ${styles.blocked}`} />Blocked</span>
      <span><i className={`${styles.dot} ${styles.held}`} />Being booked</span>
    </div>
  );
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string; day?: string }> }) {
  const ctx = await requirePartner('bookings');
  const { week: raw, day: rawDay } = await searchParams;
  const db = await getDb();
  const now = istNow();
  const dayDate = rawDay && isValidDate(rawDay) ? rawDay : null;
  const start = weekStart(dayDate ?? (raw && isValidDate(raw) ? raw : now.date));
  const { hours, days } = buildWeek(db, ctx.turf, start, now);
  const total = days.reduce((n, d) => n + d.booked, 0);
  const thisWeek = weekStart(now.date);

  const day = dayDate ? days.find((d) => d.date === dayDate) : null;

  if (day && dayDate) {
    const { resources, rows } = buildDayAcrossCourts(db, ctx.turf, dayDate, now);
    const isMultiCourt = resources.length > 1;

    return (
      <div className={dash.page}>
        <PageHeader
          title="Calendar"
          desc={`${ctx.turf.name}: ${day.booked} booking${day.booked === 1 ? '' : 's'} on ${formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'short' })}${isMultiCourt ? ` across all ${resources.length} courts / pitches` : ''}.`}
        />

        <div className={dash.card}>
          <div className={styles.toolbar}>
            <div className={styles.segment} aria-label="Calendar view">
              <Link href={`/partner/calendar?day=${dayDate}`} aria-current="page" aria-label="Day view" className={`${styles.seg} ${styles.segActive}`}>Day</Link>
              <Link href={`/partner/calendar?week=${dayDate}`} aria-label="Week view" className={styles.seg}>Week</Link>
            </div>
            <div className={styles.nav}>
              <Link href={`/partner/calendar?day=${addDays(dayDate, -1)}`} className={styles.navBtn} aria-label="Previous day"><NavIcon name="arrowLeft" size={16} /></Link>
              <Link href={`/partner/calendar?day=${now.date}`} className={`${styles.navBtn} ${dayDate === now.date ? styles.navActive : ''}`}>Today</Link>
              <Link href={`/partner/calendar?day=${addDays(dayDate, 1)}`} className={styles.navBtn} aria-label="Next day"><NavIcon name="arrowRight" size={16} /></Link>
            </div>
          </div>
        </div>

        <div className={dash.card}>
          <div className={styles.toolbar} style={{ marginBottom: 14 }}>
            <h2 className={styles.title}>{formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            <Legend />
          </div>
          <div className={styles.wrap}>
            <table className={styles.grid} style={{ minWidth: isMultiCourt ? Math.max(560, 120 + resources.length * 180) : 0 }}>
              <thead>
                <tr>
                  <th className={styles.hourCol}>Time</th>
                  {isMultiCourt ? (
                    resources.map((res) => <th key={res.id} className={styles.courtHead}>{res.name}</th>)
                  ) : (
                    <th className={styles.courtHead}>{resources[0]?.name ?? ctx.turf.name}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ hour, cells }) => (
                  <tr key={hour}>
                    <td className={styles.hour}>{formatSlotRange(hour)}</td>
                    {cells.map((c) => (
                      <td key={c.resourceId} className={`${styles.cell} ${styles.dayCell} ${stateClass(c as unknown as CalendarCell)}`}>
                        {c.bookings.map((b) => (
                          <div key={b.id}>
                            <span className={styles.name}>
                              {b.name}{b.part !== 'full' ? ` · ${b.part}` : ''}{b.source === 'walk_in' ? ' · walk-in' : ''}
                            </span>
                            <span className={styles.sub}>{b.phone} · {b.code} · {b.status.replace('_', ' ')}</span>
                          </div>
                        ))}
                        {c.state === 'blocked' && <span className={styles.name}>Blocked: {c.blockReason}</span>}
                        {c.state === 'held' && <span className={styles.sub}>Being booked…</span>}
                        {c.state === 'free' && <span className={styles.sub}>Open</span>}
                        {c.state === 'past' && c.bookings.length === 0 && <span className={styles.sub}>Past</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.hint} style={{ marginTop: 12 }}>
            <Link href={`/partner/slots?date=${day.date}`}>Block or reopen slots for this day</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={dash.page}>
      <PageHeader title="Calendar" desc={`${ctx.turf.name}: the week at a glance. Split pitches show each half.`} />

      <div className={dash.card}>
        <div className={styles.toolbar}>
          <div className={styles.segment} aria-label="Calendar view">
            <Link href={`/partner/calendar?day=${start === thisWeek ? now.date : start}`}  className={styles.seg}>Day</Link>
            <Link href={`/partner/calendar?week=${start}`}  className={`${styles.seg} ${styles.segActive}`}>Week</Link>
          </div>
          <div className={styles.nav}>
            <Link href={`/partner/calendar?week=${addDays(start, -7)}`} className={styles.navBtn} aria-label="Previous week"><NavIcon name="arrowLeft" size={16} /></Link>
            <Link href="/partner/calendar" className={`${styles.navBtn} ${start === thisWeek ? styles.navActive : ''}`}>This week</Link>
            <Link href={`/partner/calendar?week=${addDays(start, 7)}`} className={styles.navBtn} aria-label="Next week"><NavIcon name="arrowRight" size={16} /></Link>
          </div>
        </div>
      </div>

      <div className={dash.card}>
        <div className={styles.toolbar} style={{ marginBottom: 14 }}>
          <div>
            <h2 className={styles.title}>{formatDate(start)} – {formatDate(addDays(start, 6))}</h2>
            <div className={styles.summary} style={{ marginTop: 8 }}>
              <span className={styles.stat}>{total} booking{total === 1 ? '' : 's'} this week</span>
            </div>
          </div>
          <Legend />
        </div>

        <div className={styles.wrap}>
          <table className={styles.grid}>
            <thead>
              <tr>
                <th className={styles.hourCol} />
                {days.map((d) => (
                  <th key={d.date} className={d.isToday ? styles.todayHead : ''}>
                    <Link href={`/partner/calendar?day=${d.date}`}>
                      <span className={styles.dow}>{d.isToday ? 'Today' : formatDate(d.date, { weekday: 'short' })}</span>
                      <span className={styles.dnum}>{Number(d.date.slice(8))}</span>
                      <span className={styles.dsub}>{d.booked} booked</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className={styles.hour}>{formatSlotRange(hour)}</td>
                  {days.map((d) => {
                    const c = d.cells.find((x) => x.hour === hour)!;
                    return (
                      <td key={d.date} className={`${styles.cell} ${stateClass(c)}`}>
                        {c.bookings.map((b) => (
                          <span key={b.id} className={styles.name} title={`${b.name} · ${b.phone} · ${b.code} · ${b.status.replace('_', ' ')}`}>
                            {b.name}{b.part !== 'full' ? ` · ${b.part}` : ''}{b.source === 'walk_in' ? ' · walk-in' : ''}
                          </span>
                        ))}
                        {c.state === 'blocked' && <span className={styles.name} title={c.blockReason ?? ''}>Blocked: {c.blockReason}</span>}
                        {c.state === 'held' && <span className={styles.sub}>Being booked…</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.hint} style={{ marginTop: 12 }}>Click a day header for the day view; block or reopen slots from there.</p>
      </div>
    </div>
  );
}
