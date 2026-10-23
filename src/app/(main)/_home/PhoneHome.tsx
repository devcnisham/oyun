'use client';

import { SITE_CITY } from '@/modules/web/lib/site';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FavouriteButton from '@/modules/web/frontend/FavouriteButton';
import FloatingSearch from '@/modules/web/frontend/FloatingSearch';
import { getBookingSummaries, type BookingSummary } from '@/modules/web/backend/booking-actions';
import { getMyBookingIds, getProfile } from '@/modules/web/frontend/hooks/device';
import { rupees } from '@/modules/shared/lib/format';
import { canOptimize } from '@/modules/shared/backend/images';
import type { HomeData, HomeTurf } from './types';
import styles from './PhoneHome.module.css';

type Mode = 'turf' | 'play';

const TABS: { id: Mode; label: string; hint: string }[] = [
  { id: 'turf', label: 'Turfs', hint: 'Book a slot' },
  { id: 'play', label: 'Play together', hint: 'Join a game' },
];

/* ---------- small helpers ---------- */

// Adds data-in once the element scrolls into view, so cards can slide in. Everything is visible without it.
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      queueMicrotask(() => setSeen(true));
      return;
    }
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (setSeen(true), io.disconnect()), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

function Rise({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`${styles.rise} ${seen ? styles.riseIn : ''} ${className}`} style={{ ['--d' as string]: `${delay}ms` }}>
      {children}
    </div>
  );
}

// Counts up to a number when it first appears; shows the number straight away with reduced motion
function CountUp({ to }: { to: number }) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [n, setN] = useState(to);
  useEffect(() => {
    if (!seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    queueMicrotask(() => setN(0));
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);
  return <span ref={ref}>{n}</span>;
}

const Icon = {
  grid: <path d="M4 4h6.5v6.5H4V4Zm9.5 0H20v6.5h-6.5V4ZM4 13.5h6.5V20H4v-6.5Zm9.5 0H20V20h-6.5v-6.5Z" />,
  pitch: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 5v14M3 9.5h3.5v5H3M21 9.5h-3.5v5H21" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5H3Z" />
      <circle cx="17" cy="9.5" r="2.5" opacity=".7" />
      <path d="M16 14c3 0 5 1.8 5 4.5h-4.2c-.1-1.9-.4-3.2-.8-4.5Z" opacity=".7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  star: <path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8L12 3.5Z" />,
};
const Svg = ({ children, size = 24 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>{children}</svg>
);

/* ---------- header ---------- */

function Header({ venues, offers }: { venues: number; offers: number }) {
  const [initial, setInitial] = useState('');
  useEffect(() => {
    const n = getProfile().name.trim();
    queueMicrotask(() => setInitial(n ? n[0].toUpperCase() : ''));
  }, []);
  return (
    <header className={styles.header}>
      <div className={styles.loc}>
        <span className={styles.locName}>{SITE_CITY}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg></span>
        <span className={styles.locSub}>{venues} venue{venues === 1 ? '' : 's'} live · more cities soon</span>
      </div>
      <div className={styles.pills}>
        {offers > 0 && (
          <Link href="/offers" className={styles.pill} aria-label={`${offers} live offers`}>
            <span className={styles.pillDot} aria-hidden>%</span>
            <b>{offers}</b>
          </Link>
        )}
        <Link href="/profile" className={`${styles.pill} ${styles.pillWide}`} aria-label="Profile and menu">
          <span className={styles.avatar} aria-hidden>{initial || <Svg size={16}>{Icon.people}</Svg>}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M5 7h14M5 12h14M5 17h9" /></svg>
        </Link>
      </div>
    </header>
  );
}

/* ---------- the three modes ---------- */

function Tabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === mode);
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const t = TABS[(next + TABS.length) % TABS.length];
    onChange(t.id);
    document.getElementById(`tab-${t.id}`)?.focus();
  };
  return (
    <div className={styles.tabs} role="tablist" aria-label="What would you like to do" onKeyDown={onKey}>
      {TABS.map((t, i) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          type="button"
          role="tab"
          aria-selected={mode === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={mode === t.id ? 0 : -1}
          className={`${styles.tab} ${mode === t.id ? styles.tabOn : ''}`}
          style={{ ['--i' as string]: i }}
          onClick={() => onChange(t.id)}
        >
          <span className={styles.tabArt}><Svg size={30}>{t.id === 'turf' ? Icon.pitch : Icon.people}</Svg></span>
          <b>{t.label}</b>
          <small>{t.hint}</small>
        </button>
      ))}
    </div>
  );
}

function SearchRow({ words, openNow, onToggle, showToggle }: { words: string[]; openNow: boolean; onToggle: () => void; showToggle: boolean }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (words.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setW((x) => (x + 1) % words.length), 2600);
    return () => window.clearInterval(id);
  }, [words.length]);
  // Once the search row scrolls off the top, a slim copy stays pinned so search is always one tap away
  const rowRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPinned(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={rowRef} className={styles.searchRow}>
      <div className={`${styles.pinnedBar} ${pinned ? styles.pinnedOn : ''}`} aria-hidden={!pinned}>
        <FloatingSearch
          renderTrigger={(open) => (
            <button type="button" className={styles.pinnedSearch} onClick={open} tabIndex={pinned ? 0 : -1} aria-label="Search turfs, areas and sports">
              <Svg size={20}>{Icon.search}</Svg>
              <span>Search {words[0] ?? 'turfs'}</span>
            </button>
          )}
        />
      </div>
      <FloatingSearch
        renderTrigger={(open) => (
          <button type="button" className={styles.search} onClick={open} aria-label="Search turfs, areas and sports">
            <Svg size={22}>{Icon.search}</Svg>
            <span key={w} className={styles.searchWord}>Search {words[w] ?? 'turfs'}</span>
          </button>
        )}
      />
      {showToggle && (
        <button type="button" className={`${styles.toggle} ${openNow ? styles.toggleOn : ''}`} aria-pressed={openNow} onClick={onToggle}>
          <small>OPEN</small>
          <span className={styles.switch} aria-hidden><i /></span>
        </button>
      )}
    </div>
  );
}

/* ---------- turfs mode ---------- */

function Banner({ data }: { data: HomeData }) {
  return (
    <div className={styles.banner}>
      <p className={styles.bannerEye}>Tonight on OYUN</p>
      <h2 className={styles.bannerTitle}>
        {data.offerMax > 0 ? (
          <>Up to <em><CountUp to={data.offerMax} />%</em> off</>
        ) : data.openSlots > 0 ? (
          <><em><CountUp to={data.openSlots} /></em> open slots</>
        ) : (
          <>Book your <em>game</em></>
        )}
      </h2>
      <p className={styles.bannerSub}>{data.offerMax > 0 ? 'on turfs and courts near you' : 'today near you. Pay at the venue.'}</p>
    </div>
  );
}

function TurfCards({ turfs, title, href }: { turfs: HomeTurf[]; title: string; href: string }) {
  if (turfs.length === 0) return null;
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>{title}</h2>
        <Link href={href}>See all</Link>
      </div>
      <div className={styles.cards} tabIndex={0} role="region" aria-label={title}>
        {turfs.map((t, i) => (
          <Rise key={t.id} className={styles.cardWrap} delay={Math.min(i, 4) * 60}>
            <Link href={`/arenas/${t.id}`} className={styles.card}>
              <span className={styles.cardImg}>
                <Image src={t.image} alt={`${t.name} in ${t.area}`} fill sizes="70vw" loading={i < 2 ? 'eager' : 'lazy'} unoptimized={!canOptimize(t.image)} />
                <span className={styles.cardShade} aria-hidden />
                <span className={styles.cardPrice}><b>{rupees(t.pricePerHour)}</b><small>/hr</small></span>
                {t.availableToday > 0 && <span className={styles.cardSlots}>{t.availableToday} open today</span>}
              </span>
              <b className={styles.cardName}>{t.name}</b>
              <span className={styles.cardMeta}>
                {t.reviewCount > 0 ? <span className={styles.rating}><Svg size={13}>{Icon.star}</Svg>{t.rating}</span> : <span className={styles.newTag}>New</span>}
                <span>{t.area} · {t.size}</span>
              </span>
            </Link>
            <FavouriteButton turfId={t.id} turfName={t.name} className={styles.heart} />
          </Rise>
        ))}
      </div>
    </section>
  );
}

function turfMode(data: HomeData, openNow: boolean) {
  const list = data.turfs.filter((t) => (!openNow || t.availableToday > 0));
  const open = [...list].filter((t) => t.availableToday > 0).sort((a, b) => b.availableToday - a.availableToday).slice(0, 8);
  // The second rail never repeats the first: by rating once anyone has reviews, otherwise the cheapest hours
  const rated = list.some((t) => t.reviewCount > 0);
  const seen = new Set(open.map((t) => t.id));
  const ranked = rated ? [...list].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount) : [...list].sort((a, b) => a.pricePerHour - b.pricePerHour);
  const fresh = ranked.filter((t) => !seen.has(t.id));
  const top = (fresh.length >= 3 ? fresh : ranked).slice(0, 8);
  return {
    stage: (
      <>
        <Banner data={data} />
      </>
    ),
    below: (
      <>
        {list.length === 0 ? (
          <p className={styles.empty}>No venue matches right now. <Link href="/arenas">Browse every venue</Link></p>
        ) : (
          <>
            <TurfCards turfs={open} title="Open slots today" href="/arenas?sort=availability" />
            <TurfCards turfs={top} title={rated ? 'Top rated near you' : 'Best value per hour'} href="/arenas" />
          </>
        )}
        {data.promos.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}><h2>Featured</h2></div>
            <div className={styles.cards} tabIndex={0} role="region" aria-label="Featured">
              {data.promos.map((p) => (
                <div key={p.id} className={styles.promo}>
                  <Image src={p.image} alt={p.title} fill sizes="80vw" unoptimized={!canOptimize(p.image)} />
                  <span className={styles.cardShade} aria-hidden />
                  <div><b>{p.title}</b><small>{p.subtitle}</small></div>
                </div>
              ))}
            </div>
          </section>
        )}
      </>
    ),
  };
}

/* ---------- play together mode ---------- */

function playMode() {
  return {
    stage: (
      <div className={styles.banner}>
        <p className={styles.bannerEye}>Play together</p>
        <h2 className={styles.bannerTitle}>Coming <em>soon</em></h2>
        <p className={styles.bannerSub}>Find open games and players near you. We are building it.</p>
      </div>
    ),
    below: null,
  };
}

/* ---------- next game strip ---------- */

function NextGame() {
  const [next, setNext] = useState<BookingSummary | null>(null);
  useEffect(() => {
    const ids = getMyBookingIds();
    if (ids.length === 0) return;
    const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
    getBookingSummaries(ids)
      .then((list) => setNext(list.find((b) => b.status === 'confirmed' && b.date >= today) ?? null))
      .catch(() => {});
  }, []);
  if (!next) return null;
  return (
    <Link href={`/bookings/${next.id}`} className={styles.next}>
      <span><small>Your next game</small><b>{next.turfName}</b><em>{new Date(`${next.date}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} · {next.timeLabel}</em></span>
      <span className={styles.nextCta}>Ticket</span>
    </Link>
  );
}

/* ---------- page ---------- */

export default function PhoneHome({ data }: { data: HomeData }) {
  const [mode, setMode] = useState<Mode>('turf');
  const [openNow, setOpenNow] = useState(false);
  const view = mode === 'turf' ? turfMode(data, openNow) : playMode();
  const words = ['turfs', ...data.areas.slice(0, 2).map((a) => a.name), ...data.sports.slice(0, 2).map((s) => `${s.label.toLowerCase()} courts`)].map((w, i) => (i === 0 ? w : `"${w}"`));

  return (
    <div className={`${styles.home} phoneHome`}>
      <h1 className="sr-only">Book football, box cricket, badminton and pickleball turfs across India, live in {SITE_CITY} first</h1>
      <div className={styles.top}>
        <div className={styles.glow} aria-hidden />
        <Header venues={data.turfs.length} offers={data.coupons.length + data.deals.length} />
        <Tabs mode={mode} onChange={setMode} />
        <div className={styles.stage}>
          <NextGame />
          <SearchRow words={words} openNow={openNow} onToggle={() => setOpenNow((v) => !v)} showToggle={mode === 'turf'} />
          <div key={mode} id={`panel-${mode}`} role="tabpanel" aria-labelledby={`tab-${mode}`} className={styles.panel}>
            {view.stage}
          </div>
        </div>
      </div>
      <div key={`below-${mode}`} className={`${styles.below} ${styles.panel}`} role="region" aria-labelledby={`tab-${mode}`}>
        {view.below}
      </div>

      <Link href="/list-turf" prefetch={false} className={styles.owner}>
        <span><b>Own a turf?</b><small>List it free and get bookings</small></span>
        <i aria-hidden>›</i>
      </Link>
    </div>
  );
}
