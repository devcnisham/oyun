import type { Metadata } from 'next';
import { ogBase } from '@/modules/web/lib/seo';

export const metadata: Metadata = {
  title: 'List Your Venue | OYUN Partners in Mangalore',
  description:
    'Bring your sports venue to OYUN. Apply to list your venue in Mangalore and manage availability, bookings and player check-ins from your partner dashboard.',
  alternates: { canonical: '/list-turf' },
  openGraph: { ...ogBase('/list-turf'), title: 'List Your Venue | OYUN Partners' },
};

export default function ListTurfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
