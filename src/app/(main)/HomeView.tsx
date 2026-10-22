import JsonLd from '@/components/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { getSettings, getSiteContent, listPublicTurfs } from '@/lib/queries';
import { shortHour } from '@/lib/format';
import { getDb } from '@/lib/store';
import { listOpenMatches } from '@/lib/community';
import PopupAd from '@/components/PopupAdLazy';
import MobileHome from './_home/MobileHome';
import DesktopLanding from './_landing/DesktopLanding';
import { qrSvg } from '@/lib/qr';
import styles from './page.module.css';

// A phone only needs the app feed, so the proxy sends phones to /m, which skips the desktop landing page.
// Both are prebuilt and revalidated on a timer, so the CDN serves them instead of rendering for every visitor.
export async function HomeView({ phone }: { phone: boolean }) {
  const site = await getSiteContent();
  const turfs = await listPublicTurfs();
  const settings = await getSettings();
  const matches = await listOpenMatches();
  const recommended = [...turfs].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.rating - a.rating).slice(0, 10);

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
      {!phone && (
        <div className={styles.desktopHome}>
          <DesktopLanding
            title={site.heroTitle}
            qr={await qrSvg('https://www.oyun.co.in/')}
            turfs={recommended.slice(0, 3).map((t) => ({ name: t.name, area: t.area, price: t.pricePerHour }))}
          />
        </div>
      )}

      <div className={`${styles.mobileHome} ${phone ? styles.mobileForced : ''}`}>
        <MobileHome turfs={turfs} promos={site.promos} coupons={coupons} deals={deals} matches={matches} />
      </div>
    </div>
  );
}
