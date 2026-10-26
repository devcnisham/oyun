import type { Metadata } from 'next';
import MyBookings from '@/modules/web/frontend/main/bookings/MyBookings';

export const metadata: Metadata = { title: 'My bookings', robots: { index: false, follow: true } };

export default async function MyBookingsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: fresh } = await searchParams;
  return <MyBookings newIds={(fresh ?? '').split(',').filter(Boolean).slice(0, 10)} />;
}
