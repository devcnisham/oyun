import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import TurfCard from '@/components/TurfCard';
import { rupees } from '@/lib/format';
import { listAreas, listPublicTurfs } from '@/lib/queries';
import { breadcrumbSchema, itemListSchema } from '@/lib/schema';
import { SITE_CITY, areaSlug } from '@/lib/site';
import { SPORTS, sportFromSlug, sportSlug } from '@/lib/sports';
import styles from '../../turfs/[area]/page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
  const all = await listPublicTurfs();
  return SPORTS
    .filter((s) => all.some((t) => t.sports.some((x) => sportSlug(x) === sportSlug(s.value))))
    .map((s) => ({ sport: sportSlug(s.value) }));
}

interface Props {
  params: Promise<{ sport: string }>;
}

async function load(slug: string) {
  const sport = sportFromSlug(slug);
  if (!sport) return null;
  const all = await listPublicTurfs();
  const turfs = all
    .filter((t) => t.sports.some((x) => sportSlug(x) === slug))
    .sort((a, b) => b.rating - a.rating);
  if (turfs.length === 0) return null;
  return { sport, turfs, areas: listAreas(turfs), others: SPORTS.filter((s) => s.value !== sport.value && all.some((t) => t.sports.some((x) => sportSlug(x) === sportSlug(s.value)))) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sport: slug } = await params;
  const data = await load(slug);
  if (!data) return { title: 'Sport not found', robots: { index: false } };
  const { sport, turfs, areas } = data;
  const from = Math.min(...turfs.map((t) => t.pricePerHour));
  return {
    title: `${sport.label} ${sport.place}s in ${SITE_CITY} | Book online from ₹${from}/hr`,
    description: `${turfs.length} ${sport.label.toLowerCase()} ${sport.place}${turfs.length === 1 ? '' : 's'} in ${areas.join(', ')}, ${SITE_CITY}. Check live slot availability and book online on OYUN.`,
    alternates: { canonical: `/sports/${slug}` },
    openGraph: { url: `/sports/${slug}` },
  };
}

export default async function SportPage({ params }: Props) {
  const { sport: slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { sport, turfs, areas, others } = data;
  const from = Math.min(...turfs.map((t) => t.pricePerHour));
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
          itemListSchema(turfs, `${sport.label} ${sport.place}s in ${SITE_CITY}`),
        ]}
      />

      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span> <Link href="/arenas">Turfs in {SITE_CITY}</Link> <span aria-hidden>›</span> <span aria-current="page">{sport.label}</span>
      </nav>

      <h1 className={styles.title}>{sport.label} {sport.place}s in {SITE_CITY}</h1>
      <p className={styles.lead}>
        {turfs.length} {sport.place}{turfs.length === 1 ? '' : 's'} for {sport.label.toLowerCase()} in {SITE_CITY} from {rupees(from)} per hour
        {openToday > 0 ? `, with ${openToday} open slot${openToday === 1 ? '' : 's'} today` : ''}. Pick a venue to see live availability and book in under a minute.
      </p>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading" className={styles.h2}>Where to play {sport.label.toLowerCase()}</h2>
        <div className={styles.grid}>
          {turfs.map((t) => (
            <TurfCard key={t.id} turf={t} />
          ))}
        </div>
      </section>

      <section aria-labelledby="areas-heading">
        <h2 id="areas-heading" className={styles.h2}>{sport.label} by area</h2>
        <div className={styles.areas}>
          {areas.map((a) => (
            <Link key={a} href={`/turfs/${areaSlug(a)}`} className={styles.areaLink}>{a}</Link>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="sports-heading">
          <h2 id="sports-heading" className={styles.h2}>Other sports</h2>
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
