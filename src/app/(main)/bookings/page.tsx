import type { Metadata } from 'next';
import MyBookings from './MyBookings';

export const metadata: Metadata = { title: 'My bookings · OYUN' };

export default async function MyBookingsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: fresh } = await searchParams;
  return <MyBookings newIds={(fresh ?? '').split(',').filter(Boolean).slice(0, 10)} />;
}
