import type { Metadata } from 'next';

// Private dashboards: keep out of search results
export const metadata: Metadata = {
  title: { default: 'Partner dashboard', template: '%s | OYUN Partner' },
  robots: { index: false, follow: false },
};

export default function PartnerRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
