'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Reveal once when content enters view, after the startup intro has finished. */
export default function HomeMotion({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let view: IntersectionObserver | undefined;
    let content: MutationObserver | undefined;
    let startup: MutationObserver | undefined;
    const stop = () => {
      view?.disconnect(); content?.disconnect(); startup?.disconnect();
      delete root.dataset.motionReady;
    };
    const start = () => {
      stop();
      if (preference.matches) return;
      const reveal = () => {
        if (preference.matches) return;
        root.dataset.motionReady = 'true';
        view = new IntersectionObserver(entries => {
          for (const entry of entries) if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = 'true';
            view?.unobserve(entry.target);
          }
        }, { threshold: .08 });
        const observe = () => root.querySelectorAll<HTMLElement>('[data-home-reveal]:not([data-revealed])').forEach(el => view?.observe(el));
        observe();
        content = new MutationObserver(observe);
        content.observe(root, { childList: true, subtree: true });
      };
      if (!document.querySelector('[data-startup-splash]')) reveal();
      else {
        startup = new MutationObserver(() => {
          if (!document.querySelector('[data-startup-splash]')) { startup?.disconnect(); reveal(); }
        });
        startup.observe(document.body, { childList: true, subtree: true });
      }
    };
    start();
    preference.addEventListener('change', start);
    return () => { stop(); preference.removeEventListener('change', start); };
  }, []);
  return <div ref={ref} className={className} data-booking-home>{children}</div>;
}
