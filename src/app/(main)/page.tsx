import { Suspense } from 'react';
import PageSkeleton from '@/modules/shared/frontend/PageSkeleton';
import type { Metadata } from 'next';
import { localeAlternates } from '@/modules/web/lib/seo';
import { SITE_DESCRIPTION } from '@/modules/web/lib/site';
import { HomeView } from '@/modules/web/frontend/main/HomeView';

export const metadata: Metadata = {
  title: { absolute: 'OYUN | Book Sports Venues & Courts in Mangalore Online' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/', languages: localeAlternates() },
};

// Rebuilt in the background at most once a minute; the CDN serves the last build in between
export const revalidate = 60;

export default function Home() {
  return <Suspense fallback={<PageSkeleton variant="home" />}><HomeView /></Suspense>;
}
