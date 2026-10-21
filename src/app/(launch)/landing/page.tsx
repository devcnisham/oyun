import type { Metadata } from 'next';
import { getSettings } from '@/lib/queries';
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
  title: 'Turf and court booking in Mangalore',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

// The page is one night match: hero (the floodlit pitch), a ribbon of games and neighbourhoods, four court plates, a pinned
// three-step story, a lane photograph, player features, turf owners, FAQ (the only light surface) and a closing scene.
export default async function LandingPage() {
  const { supportEmail } = await getSettings();
  return (
    <div className={`${display.variable} ${body.variable} ${styles.page}`}>
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
