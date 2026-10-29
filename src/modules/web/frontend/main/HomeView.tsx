import WelcomeGuide from '@/modules/web/frontend/welcome/WelcomeGuide';
import JsonLd from '@/modules/web/frontend/JsonLd';
import { organizationSchema, websiteSchema } from '@/modules/web/lib/schema';
import { getSettings, getSiteContent, listPublicTurfs } from '@/modules/web/database/queries';
import { getDb } from '@/modules/shared/database/store';
import BookingHome from '@/modules/web/frontend/main/_booking/BookingHome';

// One server-rendered booking home for desktop and phone, with public data only.
export async function HomeView() {
  const [site, turfs, settings, db] = await Promise.all([getSiteContent(), listPublicTurfs(), getSettings(), getDb()]);
  return (
    <>
      <JsonLd data={[organizationSchema(settings.supportEmail, settings.supportPhone), websiteSchema()]} />
      <WelcomeGuide />
      <BookingHome turfs={turfs} offers={db.offers} ads={site.ads} />
    </>
  );
}
