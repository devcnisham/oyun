import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'List Your Turf for Free | Get More Bookings in Mangalore',
  description:
    'Turf owners in Mangalore: list your turf, court or sports arena on OYUN for free. Online bookings, slot management, payouts and a verified badge. Zero commission during beta.',
  alternates: { canonical: '/list-turf' },
  openGraph: { url: '/list-turf', title: 'List Your Turf on OYUN for Free' },
};

export default function ListTurfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
