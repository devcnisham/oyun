import { connection } from 'next/server';
import { Suspense } from 'react';
import { listAreas, listPublicTurfs } from '@/lib/queries';
import ArenasClient from './ArenasClient';
import styles from './page.module.css';

export default async function ArenasPage() {
  await connection(); // live availability: render per request
  const turfs = await listPublicTurfs();
  return (
    <Suspense fallback={<div className={styles.loading}>Loading arenas...</div>}>
      <ArenasClient turfs={turfs} areaNames={listAreas(turfs)} />
    </Suspense>
  );
}
