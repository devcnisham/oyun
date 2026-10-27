'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './AdPlacement.module.css';

const bannerSlides = [
  { photo: 'photo-1752614654887-0b8d59c076b0', title: 'Your game. Your ground.' },
  { photo: 'photo-1779862758053-0d4e29f93105', title: 'Find your next great deal.' },
  { photo: 'photo-1778180883969-073d6361fea3', title: 'Find your next game.' },
];
/** Sample creatives; no ad-network requests until a publisher is configured. */
export default function AdPlacement({ id, format = 'banner' }: { id: string; format?: 'banner' | 'card' }) {
  const slides = id.includes('desktop-right') ? [
    { photo: 'photo-1599058917212-d750089bc07e', title: 'Book. Show up. Play.' },
    { photo: 'photo-1518611012118-696072aa579a', title: 'More play. Better value.' },
    { photo: 'photo-1534258936925-c58bed479fcb', title: 'Bring your game.' },
  ] : id.includes('desktop') ? [
    { photo: 'photo-1517649763962-0c623066013b', title: 'PLAY BEYOND.' },
    { photo: 'photo-1534438327276-14e5300c3a48', title: 'Crazy about the game?' },
    { photo: 'photo-1517836357463-d25dfeac3438', title: 'More play. Less planning.' },
  ] : bannerSlides;
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
  },[paused,hovered,reduced,slides.length]);
  const go = (n:number) => { setPaused(true); track.current?.scrollTo({left:n*track.current.clientWidth,behavior:reduced?'auto':'smooth'}); };
  return <aside className={`${styles.carousel} ${format === 'card' ? styles.card : ''}`} aria-label="OYUN advertisement" aria-roledescription="carousel" data-ad-placement={id} data-ad-format={format} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
    <div ref={track} className={styles.track} onPointerDown={() => setPaused(true)} onFocusCapture={() => setPaused(true)} onScroll={e => setIndex(Math.round(e.currentTarget.scrollLeft/e.currentTarget.clientWidth))}>
      {slides.map((slide,i) => <div key={slide.photo} className={styles.slide} role="group" aria-label={`Advertisement ${i+1} of ${slides.length}`} aria-roledescription="slide" data-ad-container={`${id}-${i}`}>
        <Image src={`https://images.unsplash.com/${slide.photo}?w=1200&q=85&auto=format&fit=crop`} alt="" fill sizes={format==='banner'?'100vw':'(max-width:768px) 86vw,50vw'} />
        <div className={styles.creative}><span className={`${styles.brand} brand-wordmark`}>OYUN</span><small className={styles.tagline}>PLAY BEYOND.</small><p>{slide.title}</p><Link href={/deal|value/i.test(slide.title)?'/offers':'/arenas'} tabIndex={index===i?0:-1}>{/deal|value/i.test(slide.title)?'Explore offers':'Book a venue'}</Link></div>
      </div>)}
    </div>
    <div className={styles.dots} aria-label="Advertisement slides">{slides.map((slide,i)=><button key={slide.photo} type="button" aria-label={`Show advertisement ${i+1}`} aria-current={index===i?'true':undefined} onClick={()=>go(i)}><span /></button>)}</div>
  </aside>;
}
