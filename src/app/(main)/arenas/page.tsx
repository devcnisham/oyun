import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { listAreas, listPublicTurfs } from '@/lib/queries';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, itemListSchema } from '@/lib/schema';
import ArenasClient from './ArenasClient';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Turfs & Courts in Mangalore | Compare Prices & Book Slots',
  description:
    'Football and box cricket turfs and badminton and pickleball courts in Mangalore in one place. Compare by sport, area, price and rating, check today\'s open slots and book online instantly.',
  alternates: { canonical: '/arenas' },
  openGraph: { url: '/arenas' },
};

export default async function ArenasPage({ searchParams }: { searchParams: Promise<{ q?: string; area?: string; sport?: string; date?: string }> }) {
  const { q = '', area = '', sport = '', date = '' } = await searchParams;
  await connection(); // live availability: render per request
  const turfs = await listPublicTurfs();
  return (
    <>
    <JsonLd data={[itemListSchema(turfs, 'Turfs and courts in Mangalore'), breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Turfs in Mangalore', path: '/arenas' }])]} />
    <Suspense fallback={<div className={styles.loading}>Loading arenas...</div>}>
      <ArenasClient key={`${q}|${area}|${sport}|${date}`} turfs={turfs} areaNames={listAreas(turfs)} />
    </Suspense>
    </>
  );
}
