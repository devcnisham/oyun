import type { Metadata } from 'next';

// Private dashboards: keep out of search results
export const metadata: Metadata = {
  title: { default: 'Admin dashboard', template: '%s | OYUN Admin' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
