import type { Metadata } from 'next';
import { listPublicTurfs } from '@/modules/web/database/queries';
import SavedTurfs from './SavedTurfs';

export const metadata: Metadata = { title: 'Saved turfs', robots: { index: false, follow: true } };

export default async function SavedPage() {
  return <SavedTurfs turfs={await listPublicTurfs()} />;
}
