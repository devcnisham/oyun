'use client';

import { useRef } from 'react';
import { usePointerVars } from './motion';
import styles from './sections.module.css';

// A card that turns toward the pointer in 3D. Children can sit at different depths (see .depthNear and .depthFar).
export default function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  usePointerVars(ref);
  return (
    <div ref={ref} className={`${styles.tilt} ${className}`}>
      <div className={styles.tiltBody}>{children}</div>
    </div>
  );
}
