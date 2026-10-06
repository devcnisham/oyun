'use client';

import { useState } from 'react';
import PlayerForm from '@/app/(auth)/_shell/PlayerForm';
import styles from './SignInGate.module.css';

// Sign in / sign up without leaving checkout, so the held slots stay held
export default function SignInGate({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <h2 id="gate-title">{mode === 'login' ? 'Sign in to book' : 'Create your account'}</h2>
        <p className={styles.sub}>Your slots stay reserved while you sign in.</p>
        <div className={styles.tabs} role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? styles.on : ''} onClick={() => setMode('login')}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? styles.on : ''} onClick={() => setMode('signup')}>Create account</button>
        </div>
        <PlayerForm key={mode} mode={mode} onDone={onDone} />
      </div>
    </div>
  );
}
