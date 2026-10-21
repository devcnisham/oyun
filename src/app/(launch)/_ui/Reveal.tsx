'use client';

import { useEffect, useRef, useState } from 'react';
import './reveal.css';

// Fades and lifts its children in when they scroll into view. Shows straight away without JavaScript, with reduced motion,
// or when IntersectionObserver is missing, so content is never stuck hidden.
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      queueMicrotask(() => setShown(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={`reveal ${shown ? 'revealIn' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} data-reveal>
      {children}
    </Tag>
  );
}
