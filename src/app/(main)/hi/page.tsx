import type { Metadata } from 'next';
import LocalizedHomeView from '@/modules/web/frontend/LocalizedHomeView';
import { LOCALIZED, localizedPagesIndexed } from '@/modules/web/lib/localized-home';
import { localeAlternates, ogBase } from '@/modules/web/lib/seo';

export const revalidate = 60;

const c = LOCALIZED.hi;

export const metadata: Metadata = {
  title: c.title,
  description: c.description,
  alternates: { canonical: '/hi', languages: localeAlternates() },
  openGraph: { ...ogBase('/hi'), locale: 'hi_IN', title: c.title, description: c.description },
  // Closed to search engines until a native speaker has reviewed the wording
  robots: localizedPagesIndexed() ? { index: true, follow: true } : { index: false, follow: true },
};

export default function Page() {
  return <LocalizedHomeView code="hi" />;
}
