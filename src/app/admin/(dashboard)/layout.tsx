import { redirect } from 'next/navigation';
import { hasSession } from '@/lib/session';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSession('admin'))) redirect('/admin/login');

  return <AdminShell>{children}</AdminShell>;
}
