import type { Metadata } from 'next';
import { SITE_DESCRIPTION } from '@/lib/site';
import { HomeView } from '../HomeView';

// The phone version of the home page: phones reach it through a rewrite from /, so it is not a page of its own
export const metadata: Metadata = {
  title: { absolute: 'OYUN | Book Sports Turfs & Courts in Mangalore Online' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  robots: { index: false, follow: true },
};

export const revalidate = 60;

export default function PhoneHome() {
  return <HomeView phone />;
}
