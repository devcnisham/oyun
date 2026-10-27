'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Breadcrumbs.module.css';

const names: Record<string, string> = {
  blog: 'Blog', news: 'News & events', about: 'About us', guides: 'Guides', arenas: 'Sports arenas', bookings: 'Bookings', events: 'Events', tournaments: 'Tournaments', matches: 'Open matches', profile: 'Profile', settings: 'Settings', saved: 'Saved venues', offers: 'Offers', sports: 'Sports', areas: 'Areas', turfs: 'Venues', faq: 'FAQ', help: 'Help', terms: 'Terms & conditions', privacy: 'Privacy policy', 'list-turf': 'List your venue', membership: 'Membership', curated: 'Collections', prices: 'Prices', m: 'Home',
};
export default function Breadcrumbs({ guideCategories = {} }: { guideCategories?: Record<string, string> }) {
  const pathname = usePathname();
  if (pathname === '/' || pathname === '/m') return null;
  const segments = pathname.split('/').filter(Boolean);
  const label = (segment: string, index: number) => {
    if (index > 0 && segments[0] === 'bookings') return index === 1 ? 'Booking details' : names[segment] ?? 'Details';
    if (index === 1 && segments[0] === 'guides') return guideCategories[segment] ?? 'Article';
    if (index === 1 && segments[0] === 'arenas') return 'Venue details';
    return names[segment] ?? segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  return <nav className={styles.trail} aria-label="Breadcrumb"><ol>
    <li>{segments.length ? <Link href="/">Home</Link> : <span aria-current="page">Home</span>}</li>
    {segments.map((segment, i) => <li key={`${i}-${segment}`}><span aria-hidden="true" className={styles.separator}>›</span>{i === segments.length - 1 ? <span aria-current="page">{label(segment, i)}</span> : <Link href={`/${segments.slice(0, i + 1).join('/')}`}>{label(segment, i)}</Link>}</li>)}
  </ol></nav>;
}
