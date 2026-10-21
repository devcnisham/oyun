'use client';

import { useRef, useState } from 'react';
import { useScrollProgress } from './motion';
import QrArt from './QrArt';
import styles from './sections.module.css';

const STEPS = [
  { title: 'Pick your hours', text: 'Choose a turf or court, a day and the open hours you want. Prices show before you confirm.' },
  { title: 'Hold the slot', text: 'Your hours are held for 8 minutes while you check out, so nobody books them from under you.' },
  { title: 'Walk in with a ticket', text: 'Your ticket and booking history stay in one place. Show it at the turf and play.' },
];

// A scroll story. On a wide screen the stage stays pinned while three steps pass and the object on it changes:
// the slot grid, the 8-minute hold ring, the ticket. On phones, or with reduced motion, it is a plain stack.
export default function Story() {
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  useScrollProgress(root, 'pinned', (p) => setStep(Math.min(2, Math.floor(p * 3))));

  return (
    <section id="how" ref={root} className={styles.story} data-step={step} aria-labelledby="how-title">
      <div className={styles.pin}>
        <div className={`${styles.wrap} ${styles.storyGrid}`}>
          <div className={styles.storyCopy}>
            <p className={styles.eyebrow}>How it works</p>
            <h2 id="how-title" className={styles.display}>From open slot<br />to <span className={styles.redText}>kick-off.</span></h2>
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <li key={s.title} className={`${styles.stepItem} ${step === i ? styles.stepOn : ''}`}>
                  <span className={styles.stepIdx} aria-hidden="true">{i + 1}</span>
                  <div>
                    <h3 className={styles.stepTitle}>{s.title}</h3>
                    <p className={styles.stepText}>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.stage} aria-hidden="true">
            <div className={styles.stageFloor} />
            {/* 1. the slot grid */}
            <div className={`${styles.prop} ${styles.propGrid}`}>
              <div className={styles.gridHead}><b>Pick</b><span>Tonight · Turf B</span></div>
              <div className={styles.gridCells}>
                {Array.from({ length: 21 }).map((_, i) => (
                  <span key={i} className={`${styles.gcell} ${[2, 3, 4].includes(i) ? styles.gcellPick : [0, 1, 7, 9, 10, 15, 16, 20].includes(i) ? styles.gcellTaken : ''}`} style={{ '--k': i } as React.CSSProperties} />
                ))}
              </div>
            </div>
            {/* 2. the 8 minute hold */}
            <div className={`${styles.prop} ${styles.propHold}`}>
              <svg viewBox="0 0 120 120" className={styles.ring}>
                <circle cx="60" cy="60" r="52" className={styles.ringTrack} />
                <circle cx="60" cy="60" r="52" className={styles.ringFill} pathLength="100" />
              </svg>
              <div className={styles.ringText}><b>8:00</b><span>held for you</span></div>
            </div>
            {/* 3. the ticket */}
            <div className={`${styles.prop} ${styles.propTicket}`}>
              <div className={styles.ticketTop}><b>OYUN</b><span>Ticket</span></div>
              <QrArt n={17} f={5} className={styles.qr} />
              <div className={styles.ticketBase}><span>Tonight</span><span>7 to 9 PM</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
