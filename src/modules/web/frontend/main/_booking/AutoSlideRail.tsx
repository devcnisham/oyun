'use client';
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './AutoSlideRail.module.css';

export default function AutoSlideRail({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const count = Children.count(children);
  const [index,setIndex] = useState(0);
  const [paused,setPaused] = useState(false);
  const [hovered,setHovered] = useState(false);
  const [reduced,setReduced] = useState(false);
  useEffect(() => { const mq=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(mq.matches);change();mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change); },[]);
  useEffect(()=>{
    if(paused || hovered || reduced || count<2)return;
    const timer=window.setInterval(()=>{const el=rail.current;if(!el || document.hidden || el.scrollWidth<=el.clientWidth)return;const r=el.getBoundingClientRect();if(r.bottom<0 || r.top>innerHeight)return;const first=el.children[0] as HTMLElement;const next=el.children[(Math.round(el.scrollLeft/(first.offsetWidth+14))+1)%count] as HTMLElement;el.scrollTo({left:next.offsetLeft-first.offsetLeft,behavior:'smooth'});},5000);
    return()=>clearInterval(timer);
  },[paused,hovered,reduced,count]);
  const go=(i:number)=>{setPaused(true);const el=rail.current;if(!el)return;const first=el.children[0] as HTMLElement;const child=el.children[i] as HTMLElement;el.scrollTo({left:child.offsetLeft-first.offsetLeft,behavior:reduced?'auto':'smooth'});setIndex(i);};
  return <div className={styles.wrapper} aria-roledescription="carousel" aria-label={label} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
    <div ref={rail} className={className} onPointerDown={()=>setPaused(true)} onFocusCapture={()=>setPaused(true)} onScroll={e=>{const first=e.currentTarget.children[0] as HTMLElement|undefined;if(first)setIndex(Math.min(count-1,Math.round(e.currentTarget.scrollLeft/(first.offsetWidth+14))));}}>{children}</div>
    {count>1 && <div className={styles.controls}><div className={styles.dots}>{Array.from({length:count},(_,i)=><button key={i} type="button" aria-label={`Show ${label.toLowerCase()} card ${i+1}`} aria-current={index===i?'true':undefined} onClick={()=>go(i)}><span /></button>)}</div></div>}
  </div>;
}
