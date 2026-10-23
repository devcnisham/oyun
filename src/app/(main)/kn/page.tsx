import type { Metadata } from 'next';
import LocalizedHomeView from '@/modules/web/frontend/LocalizedHomeView';
import { LOCALIZED, localizedPagesIndexed } from '@/modules/web/lib/localized-home';
import { localeAlternates, ogBase } from '@/modules/web/lib/seo';

export const revalidate = 60;

const c = LOCALIZED.kn;

export const metadata: Metadata = {
  title: c.title,
  description: c.description,
  alternates: { canonical: '/kn', languages: localeAlternates() },
  openGraph: { ...ogBase('/kn'), locale: 'kn_IN', title: c.title, description: c.description },
  // Closed to search engines until a native speaker has reviewed the wording
  robots: localizedPagesIndexed() ? { index: true, follow: true } : { index: false, follow: true },
};

export default function Page() {
  return <LocalizedHomeView code="kn" />;
}
