import JsonLd from '@/modules/web/frontend/JsonLd';
import { organizationSchema, websiteSchema } from '@/modules/web/lib/schema';
import { getSettings, getSiteContent, listPublicTurfs } from '@/modules/web/database/queries';
import { shortHour } from '@/modules/shared/lib/format';
import { getDb } from '@/modules/shared/database/store';
import { listOpenMatches } from '@/modules/web/backend/community';
import PopupAd from '@/modules/web/frontend/PopupAdLazy';
import MobileHome from '@/modules/web/frontend/main/_home/MobileHome';
import styles from '@/modules/web/frontend/main/page.module.css';

// Both home routes serve the same booking feed on every screen size.
export async function HomeView() {
  const site = await getSiteContent();
  const turfs = await listPublicTurfs();
  const settings = await getSettings();
  const matches = await listOpenMatches();

  // Phone home feed extras: coupons, turf deals and every area with its turf count
  const db = await getDb();
  const coupons = db.promoCodes
    .filter((p) => p.active)
    .map((p) => ({
      code: p.code,
      title: p.kind === 'percent' ? `${p.value}% off` : `₹${p.value} off`,
      note: [p.maxDiscount ? `up to ₹${p.maxDiscount}` : '', p.weekendOnly ? 'weekends only' : 'any day'].filter(Boolean).join(' · '),
    }));
  const turfNames = new Map(turfs.map((t) => [t.id, t]));
  const deals = db.offers
    .filter((o) => o.active && turfNames.has(o.turfId))
    .map((o) => {
      const t = turfNames.get(o.turfId)!;
      return {
        id: o.id,
        turfId: t.id,
        turfName: t.name,
        image: t.images[0],
        title: o.title,
        percentOff: o.percentOff,
        when: o.type === 'first_time' ? 'Your first booking' : `${shortHour(o.startHour)} – ${shortHour(o.endHour)}`,
      };
    });


  return (
    <div className={styles.page}>
      <JsonLd data={[organizationSchema(settings.supportEmail, settings.supportPhone), websiteSchema()]} />
      <PopupAd promos={site.promos} />
      <MobileHome turfs={turfs} promos={site.promos} coupons={coupons} deals={deals} matches={matches} />
    </div>
  );
}
