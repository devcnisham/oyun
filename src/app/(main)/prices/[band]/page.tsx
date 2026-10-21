import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import TurfCard from '@/components/TurfCard';
import { rupees } from '@/lib/format';
import { PRICE_BANDS, bandFromSlug, bandSlug } from '@/lib/price-bands';
import { listPublicTurfs } from '@/lib/queries';
import { breadcrumbSchema, itemListSchema } from '@/lib/schema';
import { isIndexableTurf, ogBase } from '@/lib/seo';
import { SITE_CITY } from '@/lib/site';
import styles from '../../turfs/[area]/page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
  const turfs = (await listPublicTurfs()).filter(isIndexableTurf);
  return PRICE_BANDS.filter((b) => turfs.some((t) => t.pricePerHour <= b)).map((b) => ({ band: bandSlug(b) }));
}

async function load(slug: string) {
  const band = bandFromSlug(slug);
  if (!band) return null;
  const turfs = (await listPublicTurfs()).filter(isIndexableTurf).filter((t) => t.pricePerHour <= band).sort((a, b) => a.pricePerHour - b.pricePerHour);
  // Thin pages stay out: a band needs at least one real venue
  return turfs.length ? { band, turfs } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ band: string }> }): Promise<Metadata> {
  const { band: slug } = await params;
  const data = await load(slug);
  if (!data) return { title: 'Not found', robots: { index: false } };
  const { band, turfs } = data;
  return {
    title: `Turfs Under ${rupees(band)} per Hour in ${SITE_CITY} | Cheap Turf Booking`,
    description: `${turfs.length} turf${turfs.length === 1 ? '' : 's'} and court${turfs.length === 1 ? '' : 's'} in ${SITE_CITY} at ${rupees(band)} per hour or less, from ${rupees(turfs[0].pricePerHour)}/hr. Compare and book online on OYUN.`,
    alternates: { canonical: `/prices/${slug}` },
    openGraph: ogBase(`/prices/${slug}`),
  };
}

export default async function PriceBandPage({ params }: { params: Promise<{ band: string }> }) {
  const { band: slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { band, turfs } = data;

  return (
    <div className={`container ${styles.page}`}>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', path: '/' }, { name: `Areas in ${SITE_CITY}`, path: '/areas' }, { name: `Under ${rupees(band)}`, path: `/prices/${slug}` }]),
          itemListSchema(turfs, `Turfs under ${rupees(band)} per hour in ${SITE_CITY}`),
        ]}
      />
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span> <Link href="/areas">Areas in {SITE_CITY}</Link> <span aria-hidden>›</span> <span aria-current="page">Under {rupees(band)}</span>
      </nav>
      <h1 className={styles.title}>Turfs under {rupees(band)} per hour in {SITE_CITY}</h1>
      <p className={styles.lead}>
        {turfs.length} venue{turfs.length === 1 ? '' : 's'} at {rupees(band)} per hour or less, starting at {rupees(turfs[0].pricePerHour)}. Prices are per hour for the whole turf or court; evening peak slots can cost a little more.
      </p>
      <section aria-labelledby="list-heading">
        <h2 id="list-heading" className={styles.h2}>Venues under {rupees(band)}</h2>
        <div className={styles.grid}>
          {turfs.map((t) => (
            <TurfCard key={t.id} turf={t} />
          ))}
        </div>
      </section>
      <section aria-labelledby="more-heading">
        <h2 id="more-heading" className={styles.h2}>Other budgets</h2>
        <div className={styles.areas}>
          {PRICE_BANDS.filter((b) => b !== band).map((b) => (
            <Link key={b} href={`/prices/${bandSlug(b)}`} className={styles.areaLink}>Turfs under {rupees(b)} per hour</Link>
          ))}
          <Link href="/areas" className={styles.areaLink}>Browse by area</Link>
        </div>
      </section>
    </div>
  );
}
