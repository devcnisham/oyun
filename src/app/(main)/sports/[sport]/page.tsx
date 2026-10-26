import type { Metadata } from 'next';
import { isIndexableTurf, ogBase } from '@/modules/web/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FaqList from '@/modules/web/frontend/FaqList';
import JsonLd from '@/modules/web/frontend/JsonLd';
import TurfGrid from '@/modules/web/frontend/TurfGrid';
import { rupees } from '@/modules/shared/lib/format';
import { listAreas, listPublicTurfs } from '@/modules/web/database/queries';
import { breadcrumbSchema, faqSchema, itemListSchema } from '@/modules/web/lib/schema';
import { SITE_CITY, areaSlug } from '@/modules/web/lib/site';
import { getSportFaqs } from '@/modules/web/lib/sport-faqs';
import { SPORTS, sportFromSlug, sportSlug } from '@/modules/web/lib/sports';
import styles from '../../turfs/[area]/page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
  return SPORTS.map((s) => ({ sport: sportSlug(s.value) }));
}

interface Props {
  params: Promise<{ sport: string }>;
}

async function load(slug: string) {
  const sport = sportFromSlug(slug);
  if (!sport) return null;
  const all = (await listPublicTurfs()).filter(isIndexableTurf);
  const turfs = all
    .filter((t) => t.sports.some((x) => sportSlug(x) === slug))
    .sort((a, b) => b.rating - a.rating);
  const faqs = getSportFaqs(slug);
  return {
    sport,
    turfs,
    areas: listAreas(turfs),
    others: SPORTS.filter((s) => s.value !== sport.value),
    faqs,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sport: slug } = await params;
  const data = await load(slug);
  if (!data) return { title: 'Sport not found', robots: { index: false } };
  const { sport, turfs, areas } = data;
  if (turfs.length === 0) {
    return {
      title: `${sport.label} Courts in ${SITE_CITY} | Venue Guide & Launch Updates`,
      description: `Complete guide to ${sport.label.toLowerCase()} in ${SITE_CITY}. Discover court developments, rules, equipment tips, and get notified when slots launch on OYUN.`,
      alternates: { canonical: `/sports/${slug}` },
      openGraph: ogBase(`/sports/${slug}`),
    };
  }
  const from = Math.min(...turfs.map((t) => t.pricePerHour));
  return {
    title: `${sport.label} ${sport.place}s in ${SITE_CITY} | Book online from ₹${from}/hr`,
    description: `${turfs.length} ${sport.label.toLowerCase()} ${sport.place}${turfs.length === 1 ? '' : 's'} in ${areas.join(', ')}, ${SITE_CITY}. Check live slot availability and book online on OYUN.`,
    alternates: { canonical: `/sports/${slug}` },
    openGraph: ogBase(`/sports/${slug}`),
  };
}

export default async function SportPage({ params }: Props) {
  const { sport: slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { sport, turfs, areas, others, faqs } = data;
  const from = turfs.length > 0 ? Math.min(...turfs.map((t) => t.pricePerHour)) : 0;
  const openToday = turfs.reduce((n, t) => n + t.availableToday, 0);

  return (
    <div className={`container ${styles.page}`}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `Turfs in ${SITE_CITY}`, path: '/arenas' },
            { name: sport.label, path: `/sports/${slug}` },
          ]),
          ...(turfs.length > 0 ? [itemListSchema(turfs, `${sport.label} ${sport.place}s in ${SITE_CITY}`)] : []),
          faqSchema(faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span> <Link href="/arenas">Turfs in {SITE_CITY}</Link> <span aria-hidden>›</span> <span aria-current="page">{sport.label}</span>
      </nav>

      <h1 className={styles.title}>{sport.label} {sport.place}s in {SITE_CITY}</h1>
      <p className={styles.lead}>
        {turfs.length > 0 ? (
          <>
            {turfs.length} {sport.place}{turfs.length === 1 ? '' : 's'} for {sport.label.toLowerCase()} in {SITE_CITY} from {rupees(from)} per hour
            {openToday > 0 ? `, with ${openToday} open slot${openToday === 1 ? '' : 's'} today` : ''}. Pick a venue to see live availability and book in under a minute.
          </>
        ) : (
          <>
            Explore {sport.label.toLowerCase()} in {SITE_CITY}. Dedicated courts are currently under development across the coastal belt. Discover rules, equipment requirements, and launch FAQs below.
          </>
        )}
      </p>

      {turfs.length > 0 ? (
        <section aria-labelledby="list-heading">
          <h2 id="list-heading" className={styles.h2}>Where to play {sport.label.toLowerCase()}</h2>
          <TurfGrid turfs={turfs} />
        </section>
      ) : (
        <div className={styles.emptyState}>
          <div style={{ fontSize: '40px' }}>{sport.icon}</div>
          <h2 className={styles.emptyTitle}>Dedicated {sport.label} Courts Coming Soon</h2>
          <p className={styles.emptyDesc}>
            Venues in {SITE_CITY} are currently constructing dedicated courts for {sport.label.toLowerCase()}. Are you a turf owner opening a {sport.label.toLowerCase()} court? List with us to reach hundreds of players daily.
          </p>
          <Link href="/list-turf" className={styles.areaLink} style={{ background: 'var(--primary-700)', color: '#fff', borderColor: 'var(--primary-700)' }}>
            List Your {sport.label} Venue
          </Link>
        </div>
      )}

      {areas.length > 0 && (
        <section aria-labelledby="areas-heading">
          <h2 id="areas-heading" className={styles.h2}>{sport.label} by area in {SITE_CITY}</h2>
          <div className={styles.areas}>
            {areas.map((a) => (
              <Link key={a} href={`/sports/${slug}/${areaSlug(a)}`} className={styles.areaLink}>
                {sport.label} in {a}
              </Link>
            ))}
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className={styles.h2}>Frequently asked questions about {sport.label.toLowerCase()} in {SITE_CITY}</h2>
          <FaqList faqs={faqs} />
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="sports-heading">
          <h2 id="sports-heading" className={styles.h2}>Other sports in {SITE_CITY}</h2>
          <div className={styles.areas}>
            {others.map((s) => (
              <Link key={s.value} href={`/sports/${sportSlug(s.value)}`} className={styles.areaLink}>{s.label}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
