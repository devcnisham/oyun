import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { getSettings } from '@/lib/queries';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { ogBase } from '@/lib/seo';
import { SITE_CITY, SITE_DESCRIPTION } from '@/lib/site';
import SiteFooter from '../_ui/SiteFooter';
import SiteHeader from '../_ui/SiteHeader';
import Faq from './Faq';
import Features from './Features';
import Finale from './Finale';
import { body, display } from './fonts';
import Hero from './Hero';
import Lane from './Lane';
import Owners from './Owners';
import Ribbon from './Ribbon';
import styles from './sections.module.css';
import Sports from './Sports';
import Story from './Story';

export const metadata: Metadata = {
  title: 'Book Football, Box Cricket, Badminton & Pickleball Turfs in Mangalore',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { ...ogBase('/'), title: 'OYUN | Book Sports Turfs & Courts in Mangalore Online', description: SITE_DESCRIPTION },
};

// The page is one night match: hero (the floodlit pitch), a ribbon of games and neighbourhoods, four court plates, a pinned
// three-step story, a lane photograph, player features, turf owners, FAQ (the only light surface) and a closing scene.
export default async function LandingPage() {
  const { supportEmail, supportPhone } = await getSettings();
  return (
    <div className={`${display.variable} ${body.variable} ${styles.page}`}>
      <JsonLd data={[organizationSchema(supportEmail, supportPhone), websiteSchema()]} />
      <SiteHeader />
      <main id="content">
        <Hero city={SITE_CITY} />
        <Ribbon />
        <Sports />
        <Story />
        <Lane />
        <Features />
        <Owners supportEmail={supportEmail} />
        <Faq />
        <Finale />
      </main>
      <SiteFooter supportEmail={supportEmail} />
    </div>
  );
}
