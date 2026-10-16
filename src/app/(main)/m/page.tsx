import type { Metadata } from 'next';
import { SITE_DESCRIPTION } from '@/lib/site';
import { HomeView } from '../HomeView';

// The phone version of the home page: phones reach it through a rewrite from /, so it must stay indexable (canonical points at /)
export const metadata: Metadata = {
  title: { absolute: 'OYUN | Book Sports Turfs & Courts in Mangalore Online' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

export const revalidate = 60;

export default function PhoneHome() {
  return <HomeView phone />;
}
