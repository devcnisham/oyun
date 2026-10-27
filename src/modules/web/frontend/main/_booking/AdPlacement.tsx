'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './AdPlacement.module.css';

const slides = [
  { photo: 'photo-1752614654887-0b8d59c076b0', title: 'Your next game is calling.' },
  { photo: 'photo-1779862758053-0d4e29f93105', title: 'Make room for more play.' },
  { photo: 'photo-1778180883969-073d6361fea3', title: 'Find your next venue.' },
];
/** Sample creatives; no ad-network requests until a publisher is configured. */
export default function AdPlacement({ id, format = 'banner' }: { id: string; format?: 'banner' | 'card' }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => { const mq = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReduced(mq.matches); update(); mq.addEventListener('change', update); return () => mq.removeEventListener('change', update); }, []);
  useEffect(() => {
    if (paused || hovered || reduced) return;
    const timer = window.setInterval(() => { const el=track.current; if (!el || document.hidden) return; const rect=el.getBoundingClientRect(); if (rect.bottom<0 || rect.top>innerHeight) return; const next=(Math.round(el.scrollLeft/el.clientWidth)+1)%slides.length; el.scrollTo({ left:next*el.clientWidth, behavior:'smooth' }); },5000);
    return () => window.clearInterval(timer);
  },[paused,hovered,reduced]);
  const go = (n:number) => { setPaused(true); track.current?.scrollTo({left:n*track.current.clientWidth,behavior:reduced?'auto':'smooth'}); };
  return <aside className={`${styles.carousel} ${format === 'card' ? styles.card : ''}`} aria-label="Demo advertisement" aria-roledescription="carousel" data-ad-placement={id} data-ad-format={format} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
    <div ref={track} className={styles.track} onPointerDown={() => setPaused(true)} onFocusCapture={() => setPaused(true)} onScroll={e => setIndex(Math.round(e.currentTarget.scrollLeft/e.currentTarget.clientWidth))}>
      {slides.map((slide,i) => <div key={slide.photo} className={styles.slide} role="group" aria-label={`Advertisement ${i+1} of ${slides.length}`} aria-roledescription="slide" data-ad-container={`${id}-${i}`}>
        <Image src={`https://images.unsplash.com/${slide.photo}?w=1200&q=85&auto=format&fit=crop`} alt="" fill sizes={format==='banner'?'100vw':'(max-width:768px) 86vw,50vw'} />
        <div className={styles.creative}><span>Advertisement · Demo</span><p>{slide.title}</p><Link href="/arenas" tabIndex={index===i?0:-1}>Explore venues</Link></div>
      </div>)}
    </div>
    <div className={styles.dots} aria-label="Advertisement slides">{slides.map((slide,i)=><button key={slide.photo} type="button" aria-label={`Show advertisement ${i+1}`} aria-current={index===i?'true':undefined} onClick={()=>go(i)}><span /></button>)}</div>
  </aside>;
}
