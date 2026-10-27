import type { Metadata } from 'next';
import { isIndexableTurf, ogBase } from '@/modules/web/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/modules/web/frontend/JsonLd';
import TurfCard from '@/modules/web/frontend/TurfCard';
import { rupees } from '@/modules/shared/lib/format';
import { listAreas, listPublicTurfs } from '@/modules/web/database/queries';
import { breadcrumbSchema, faqSchema, itemListSchema } from '@/modules/web/lib/schema';
import { areaSlug } from '@/modules/web/lib/site';
import styles from './page.module.css';
import { sportInfo } from '@/modules/web/lib/sports';

// Sports played at these venues, e.g. "football and box cricket"
function areaSports(turfs: { sports: string[] }[]) {
  const names = [...new Set(turfs.flatMap((t) => t.sports.map((s) => sportInfo(s).label.toLowerCase())))];
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? 'sports';
}

export const revalidate = 60;

export async function generateStaticParams() {
  const turfs = (await listPublicTurfs()).filter(isIndexableTurf);
  return listAreas(turfs).map((a) => ({ area: areaSlug(a) }));
}

interface Props {
  params: Promise<{ area: string }>;
}

async function load(slug: string) {
  const turfs = (await listPublicTurfs()).filter(isIndexableTurf);
  const areas = listAreas(turfs);
  const area = areas.find((a) => areaSlug(a) === slug);
  if (!area) return null;
  return { area, areas, turfs: turfs.filter((t) => t.area === area).sort((a, b) => b.rating - a.rating), all: turfs };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: slug } = await params;
  const data = await load(slug);
  if (!data) return { title: 'Area not found', robots: { index: false } };
  const { area, turfs } = data;
  const from = Math.min(...turfs.map((t) => t.pricePerHour));
  return {
    title: `Venues & Courts in ${area}, Mangalore | Book from ₹${from}/hr`,
    description: `${turfs.length} venue${turfs.length === 1 ? '' : 's'} in ${area}, Mangalore for ${areaSports(turfs)}. Check live slot availability and book online on OYUN.`,
    alternates: { canonical: `/turfs/${slug}` },
    openGraph: ogBase(`/turfs/${slug}`),
  };
}

export default async function AreaPage({ params }: Props) {
  const { area: slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { area, areas, turfs } = data;
  const from = Math.min(...turfs.map((t) => t.pricePerHour));
  const openToday = turfs.reduce((n, t) => n + t.availableToday, 0);
  const sizes = [...new Set(turfs.map((t) => t.size))];
  const amenities = [...new Set(turfs.flatMap((t) => t.amenities))].slice(0, 6);
  // Facts come straight from the venues, so the page says something specific about this area
  const to = Math.max(...turfs.map((t) => t.pricePerHour));
  const opens = turfs.map((t) => t.openTime).sort()[0];
  const closes = turfs.map((t) => t.closeTime).sort().at(-1);
  const faqs = [
    { q: `How much does a venue cost in ${area}, Mangalore?`, a: `Venues and courts in ${area} cost ${from === to ? rupees(from) : `${rupees(from)} to ${rupees(to)}`} per hour on OYUN. Peak evening slots can cost a little more than morning slots.` },
    { q: `Which sports can I play in ${area}?`, a: `Venues in ${area} offer ${areaSports(turfs)}.` },
    { q: `What time do venues in ${area} open?`, a: `Venues in ${area} open from ${opens} and the latest closes at ${closes === '00:00' ? 'midnight' : closes}. Check each venue page for exact hours and live open slots.` },
  ];

  return (
    <div className={`container ${styles.page}`}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Venues in Mangalore', path: '/arenas' },
            { name: area, path: `/turfs/${slug}` },
          ]),
          itemListSchema(turfs, `Venues and courts in ${area}, Mangalore`),
          faqSchema(faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span> <Link href="/arenas">Venues in Mangalore</Link> <span aria-hidden>›</span> <span aria-current="page">{area}</span>
      </nav>

      <h1 className={styles.title}>Venues and courts in {area}, Mangalore</h1>
      <p className={styles.lead}>
        {turfs.length} venue{turfs.length === 1 ? '' : 's'} for {areaSports(turfs)} in {area} from {rupees(from)} per hour
        {openToday > 0 ? `, with ${openToday} open slot${openToday === 1 ? '' : 's'} today` : ''}. Pick a venue to see live availability and book in under a minute.
      </p>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading" className={styles.h2}>Venues in {area}</h2>
        <div className={styles.grid}>
          {turfs.map((t) => (
            <TurfCard key={t.id} turf={t} />
          ))}
        </div>
      </section>

      <section className={styles.about} aria-labelledby="about-heading">
        <h2 id="about-heading" className={styles.h2}>Playing sports in {area}</h2>
        <p>
          Venues in {area} offer {sizes.join(' and ')}{amenities.length ? ` with ${amenities.join(', ').toLowerCase()}` : ''}. Evening slots between 6 PM and 10 PM
          fill up fastest and cost a little more at peak time, while early-morning games are usually cheaper and often carry an Early Bird discount.
          Book online on OYUN to lock your slot instantly, pay in full or a small advance, and check in at the venue with your QR code.
        </p>
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.h2}>Venue booking in {area}: quick answers</h2>
        {faqs.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="areas-heading">
        <h2 id="areas-heading" className={styles.h2}>Venues in other areas</h2>
        <div className={styles.areas}>
          {areas.filter((a) => a !== area).map((a) => (
            <Link key={a} href={`/turfs/${areaSlug(a)}`} className={styles.areaLink}>Venues in {a}</Link>
          ))}
          <Link href="/arenas" className={styles.areaLink}>All venues in Mangalore</Link>
        </div>
      </section>
    </div>
  );
}
