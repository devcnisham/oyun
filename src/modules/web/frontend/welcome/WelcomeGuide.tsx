'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmationMark } from '@/modules/shared/frontend/OyunMotion';
import styles from './WelcomeGuide.module.css';

const KEY = 'oyun-welcome-v1';
const STEPS = [
  { title: 'Find your venue', text: 'Search by venue, area or sport. Open the map to explore places to play.', symbol: '⌕' },
  { title: 'Pick your time', text: 'Choose a date, pitch and available slot. Review the price before confirming.', symbol: '◷' },
  { title: 'Keep your ticket', text: 'Your confirmed booking appears in My bookings. Download the QR and show it at the venue.', symbol: '✓' },
];

function GuideDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const current = STEPS[step];
  return createPortal(<dialog className={styles.dialog} ref={ref} onCancel={e => { e.preventDefault(); onClose(); }} aria-modal="true" aria-labelledby="guide-heading" aria-describedby="guide-description">
      <div className={styles.top}><span>OYUN / Getting started</span><button onClick={onClose} type="button">Skip</button></div>
      <div className={styles.illustration} aria-hidden="true">{step === 2 ? <ConfirmationMark /> : current.symbol}</div>
      <div aria-live="polite" aria-atomic="true"><p className={styles.counter}>Step {step + 1} of {STEPS.length}</p><h2 id="guide-heading">{current.title}</h2><p id="guide-description">{current.text}</p></div>
      <div className={styles.bottom}><button type="button" className={styles.secondary} onClick={() => setStep(s => s - 1)} disabled={step === 0}>Back</button><button type="button" className={styles.primary} onClick={() => step === STEPS.length - 1 ? onClose() : setStep(s => s + 1)}>{step === STEPS.length - 1 ? 'Start playing' : 'Next'}</button></div>
  </dialog>, document.body);
}

export default function WelcomeGuide() {
  const [firstVisit, setFirstVisit] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { setFirstVisit(localStorage.getItem(KEY) !== 'done'); } catch { setFirstVisit(true); }
      if (new URLSearchParams(window.location.search).get('guide') === '1') setOpen(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const dismiss = () => {
    try { localStorage.setItem(KEY, 'done'); } catch { /* Storage can be unavailable in private browsers. */ }
    setFirstVisit(false);
    setOpen(false);
  };
  return <>
    {firstVisit ? <aside className={styles.welcome} aria-label="Welcome to OYUN"><div><b>New to OYUN?</b><span>Your first game, in three steps.</span></div><div className={styles.actions}><button type="button" className={styles.primary} onClick={() => setOpen(true)}>Show me</button><button type="button" className={styles.secondary} onClick={dismiss}>Skip</button></div></aside> : null}
    {open && <GuideDialog onClose={dismiss} />}
  </>;
}
