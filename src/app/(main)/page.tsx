import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';
import { SITE_DESCRIPTION } from '@/lib/site';
import { HomeView } from './HomeView';

export const metadata: Metadata = {
  title: { absolute: 'OYUN | Book Sports Turfs & Courts in Mangalore Online' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/', languages: localeAlternates() },
};

// Rebuilt in the background at most once a minute; the CDN serves the last build in between
export const revalidate = 60;

export default function Home() {
  return <HomeView phone={false} />;
}
