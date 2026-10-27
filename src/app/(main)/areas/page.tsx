import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/modules/web/frontend/JsonLd';
import { rupees } from '@/modules/shared/lib/format';
import { PRICE_BANDS, bandSlug } from '@/modules/web/lib/price-bands';
import { listAreas, listPublicTurfs } from '@/modules/web/database/queries';
import { breadcrumbSchema } from '@/modules/web/lib/schema';
import { isIndexableTurf, ogBase } from '@/modules/web/lib/seo';
import { SITE_CITY, areaSlug } from '@/modules/web/lib/site';
import { sportInfo } from '@/modules/web/lib/sports';
import styles from '../turfs/[area]/page.module.css';

export const metadata: Metadata = {
  title: `Venues & Courts by Area in ${SITE_CITY} | Kodialbail, Kankanady, Ullal & more`,
  description: `Find a football venue, box cricket ground, badminton or pickleball court near you in ${SITE_CITY}. Browse every neighbourhood with live slot availability and prices.`,
  alternates: { canonical: '/areas' },
  openGraph: ogBase('/areas'),
};

export const revalidate = 60;

export default async function AreasHubPage() {
  const turfs = (await listPublicTurfs()).filter(isIndexableTurf);
  const areas = listAreas(turfs).filter((a) => a !== SITE_CITY);
  const rows = areas.map((area) => {
    const here = turfs.filter((t) => t.area === area);
    const sports = [...new Set(here.flatMap((t) => t.sports.map((s) => sportInfo(s).label)))];
    return { area, count: here.length, from: Math.min(...here.map((t) => t.pricePerHour)), sports };
  });
  const cheapest = PRICE_BANDS.filter((b) => turfs.some((t) => t.pricePerHour <= b));

  return (
    <div className={`container ${styles.page}`}>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: `Areas in ${SITE_CITY}`, path: '/areas' }])} />
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span> <span aria-current="page">Areas in {SITE_CITY}</span>
      </nav>
      <h1 className={styles.title}>Venues and courts by area in {SITE_CITY}</h1>
      <p className={styles.lead}>
        {turfs.length} venues across {rows.length} neighbourhoods. Pick your area to see football venues, box cricket grounds, badminton and pickleball courts with live slots and prices.
      </p>

      <section aria-labelledby="areas-heading">
        <h2 id="areas-heading" className={styles.h2}>Browse by neighbourhood</h2>
        <div className={styles.areas}>
          {rows.map((r) => (
            <Link key={r.area} href={`/turfs/${areaSlug(r.area)}`} className={styles.areaLink}>
              Venues in {r.area}: {r.count} venue{r.count === 1 ? '' : 's'} from {rupees(r.from)}/hr ({r.sports.join(', ')})
            </Link>
          ))}
        </div>
      </section>

      {cheapest.length > 0 && (
        <section aria-labelledby="budget-heading">
          <h2 id="budget-heading" className={styles.h2}>Browse by budget</h2>
          <div className={styles.areas}>
            {cheapest.map((b) => (
              <Link key={b} href={`/prices/${bandSlug(b)}`} className={styles.areaLink}>Venues under {rupees(b)} per hour in {SITE_CITY}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
