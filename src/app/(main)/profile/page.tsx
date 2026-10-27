import { auth } from '@clerk/nextjs/server';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import { getDb } from '@/modules/shared/database/store';
import type { Metadata } from 'next';
import { getSettings } from '@/modules/web/database/queries';
import ProfileScreen from '@/modules/web/frontend/main/profile/ProfileScreen';

export const metadata: Metadata = { title: 'Account', robots: { index: false, follow: true } };

export default async function ProfilePage() {
  const s = await getSettings();
  const db = await getDb();
  const accountId = clerkEnabled ? (await auth()).userId : null;
  const player = accountId ? db.players.find(p => p.accountId === accountId) : undefined;
  return <ProfileScreen supportEmail={s.supportEmail} walletBalance={player?.walletBalance ?? null} offerCount={db.offers.filter(o => o.active).length} />;
}
