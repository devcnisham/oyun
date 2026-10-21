'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './motion';

// Pulls its child a few pixels toward the pointer when it comes near, then lets it settle back. Desktop mouse only.
export default function Magnetic({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
      el.style.transform = near ? `translate3d(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px, 0)` : '';
    };
    const reset = () => {
      el.style.transform = '';
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', reset);
    };
  }, [strength]);

  return (
    <span ref={ref} style={{ display: 'inline-block', transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {children}
    </span>
  );
}
