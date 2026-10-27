import type { Metadata } from 'next';
import { ogBase } from '@/modules/web/lib/seo';

export const metadata: Metadata = {
  title: 'List Your Venue for Free | Get More Bookings in Mangalore',
  description:
    'Venue owners in Mangalore: list your venue, court or sports arena on OYUN for free. Online bookings, slot management, payouts and a verified badge. Zero commission during beta.',
  alternates: { canonical: '/list-turf' },
  openGraph: { ...ogBase('/list-turf'), title: 'List Your Venue on OYUN for Free' },
};

export default function ListTurfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
