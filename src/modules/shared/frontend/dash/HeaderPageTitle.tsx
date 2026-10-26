'use client';

import { usePathname } from 'next/navigation';

// Current page name for the dashboard top bar: the nav item with the longest matching path prefix
export default function HeaderPageTitle({ items, fallback, className }: { items: { href: string; label: string }[]; fallback: string; className?: string }) {
  const pathname = usePathname();
  const match = items
    .filter((i) => (i.href === '/partner' || i.href === '/admin' ? pathname === i.href : pathname.startsWith(i.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return <span className={className}>{match?.label ?? fallback}</span>;
}
