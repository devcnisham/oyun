import type { Metadata } from 'next';
import { listPublicTurfs } from '@/modules/web/database/queries';
import SavedTurfs from '@/modules/web/frontend/main/saved/SavedTurfs';

export const metadata: Metadata = { title: 'Saved venues', robots: { index: false, follow: true } };

export default async function SavedPage() {
  return <SavedTurfs turfs={await listPublicTurfs()} />;
}
