import { redirect } from 'next/navigation';
import { hasSession } from '@/modules/shared/backend/session';
import AdminShell from '@/modules/admin/frontend/AdminShell';
import LaunchBanner from '@/modules/admin/frontend/LaunchBanner';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSession('admin'))) redirect('/admin/login');

  return (
    <AdminShell>
      <LaunchBanner />
      {children}
    </AdminShell>
  );
}
