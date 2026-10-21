'use client';

import { useEffect, useState } from 'react';
import { LAUNCH_AT, hostFor } from '@/lib/hosts';

// The booking button on the landing page. It opens the booking site (app.oyun.co.in). The booking site is closed until
// launch, so before then the button says when booking opens and goes live by itself at the launch time.
export default function BookButton({ className, closedClassName }: { className: string; closedClassName: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const wait = LAUNCH_AT - Date.now();
    if (wait <= 0) {
      queueMicrotask(() => setOpen(true));
      return;
    }
    const id = setTimeout(() => setOpen(true), Math.min(wait, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, []);

  if (open) {
    return (
      <a className={className} href={`https://${hostFor('app')}/`}>
        Book a slot
      </a>
    );
  }
  return (
    <span className={closedClassName} role="status">
      Book a slot<small> · opens 31 October</small>
    </span>
  );
}
