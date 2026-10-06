'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Remembers that the visitor has moved between pages inside OYUN, so BackButton knows going back stays on the site
export default function NavTracker() {
  const pathname = usePathname();
  const first = useRef(pathname);
  useEffect(() => {
    if (pathname !== first.current) (window as unknown as { __oyunNavigated?: boolean }).__oyunNavigated = true;
  }, [pathname]);
  return null;
}
