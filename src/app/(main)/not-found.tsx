import type { Metadata } from 'next';
import StatusPage from '@/components/status/StatusPage';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return <StatusPage code="404" title="This pitch doesn't exist" message="The page you're looking for has moved or never existed. Let's get you back in the game." />;
}
