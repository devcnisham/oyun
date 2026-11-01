'use client';

import { useEffect, useRef, useState } from 'react';

export default function AnimatedSlotCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const current = useRef(0);
  useEffect(() => {
    const start = current.current;
    const began = performance.now();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame: number;
    const tick = (now: number) => {
      const progress = reduced ? 1 : Math.min((now - began) / 700, 1);
      const next = Math.round(start + (value - start) * (1 - (1 - progress) ** 3));
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return display;
}
