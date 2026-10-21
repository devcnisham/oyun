'use client';

import { useEffect, useRef } from 'react';

// Scroll-linked hero motion: writes the hero's scroll progress (0 at the top, 1 once it is scrolled out) to --hero-p
// on the hero <section>, and the stylesheet turns that into the parallax, zoom, dim and fade. Desktop only, and
// skipped for people who prefer reduced motion.
export default function HeroScroll() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hero = marker.current?.closest('section');
    if (!hero) return;
    const desktop = window.matchMedia('(min-width: 769px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const update = () => {
      frame = 0;
      if (!desktop.matches || reduced.matches) {
        hero.style.removeProperty('--hero-p');
        return;
      }
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
      hero.style.setProperty('--hero-p', p.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      hero.style.removeProperty('--hero-p');
    };
  }, []);

  return <span ref={marker} hidden />;
}
