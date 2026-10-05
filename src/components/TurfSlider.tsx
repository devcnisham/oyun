'use client';

import { useRef } from 'react';
import TurfCard from '@/components/TurfCard';
import type { TurfSummary } from '@/lib/types';
import styles from './TurfSlider.module.css';
import Link from 'next/link';

interface TurfSliderProps {
  title: string;
  turfs: TurfSummary[];
  viewAllLink?: string;
}

export default function TurfSlider({ title, turfs, viewAllLink }: TurfSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      // 300px roughly covers a card + gap. For desktop, scrolling 2 cards at a time feels good.
      const scrollAmount = 600; 
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.controls}>
          {viewAllLink && (
            <Link href={viewAllLink} className={styles.viewAll}>
              View All
            </Link>
          )}
          <div className={styles.arrows}>
            <button className={styles.arrowBtn} onClick={() => scroll('left')} aria-label="Scroll left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button className={styles.arrowBtn} onClick={() => scroll('right')} aria-label="Scroll right">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div className={styles.sliderWrapper}>
        <div className={styles.slider} ref={scrollRef}>
          {turfs.map((turf) => (
            <div key={turf.id} className={styles.slide}>
              <TurfCard turf={turf} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
