import { redirect } from 'next/navigation';
import { hasSession } from '@/lib/session';
import AdminShell from './AdminShell';
import LaunchBanner from './LaunchBanner';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSession('admin'))) redirect('/admin/login');

  return (
    <AdminShell>
      <LaunchBanner />
      {children}
    </AdminShell>
  );
}
