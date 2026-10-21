import type { Metadata } from 'next';
import { ogBase } from '@/lib/seo';
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
  openGraph: ogBase('/arenas'),
};

// Open-slot counts are rebuilt in the background every 30 seconds and served from the CDN in between;
// a slot is always checked again on the server when someone holds or books it
export const revalidate = 30;

export default async function ArenasPage() {
  const turfs = await listPublicTurfs();
  return (
    <>
    <JsonLd data={[itemListSchema(turfs, 'Turfs and courts in Mangalore'), breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Turfs in Mangalore', path: '/arenas' }])]} />
    <Suspense fallback={<div className={styles.loading}>Loading arenas...</div>}>
      <ArenasClient turfs={turfs} areaNames={listAreas(turfs)} />
    </Suspense>
    </>
  );
}
