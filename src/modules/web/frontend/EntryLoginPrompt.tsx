'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import { useAccount, useOpenClerkSignIn, useOpenClerkSignUp } from '@/modules/web/frontend/hooks/use-account';
import { useDialogFocus } from '@/modules/web/frontend/hooks/use-dialog-focus';
import gate from '@/modules/web/frontend/SignInGate.module.css';
import styles from '@/modules/web/frontend/EntryLoginPrompt.module.css';

const SignInGate = dynamic(() => import('@/modules/web/frontend/SignInGate'));
// Shown once per browser tab: closing it (or signing in) keeps it away until the tab is closed
const SEEN = 'oyun_entry_prompt';
const NOTE = 'You can browse without an account. Sign in when you are ready to book.';

function ClerkChoice({ onClose, onLogin, onSignup }: { onClose: () => void; onLogin: () => void; onSignup: () => void }) {
  const ref = useDialogFocus<HTMLDivElement>(onClose);
  return (
    <div className={gate.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={gate.sheet} role="dialog" aria-modal="true" aria-labelledby="entry-title">
        <button type="button" className={gate.close} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <h2 id="entry-title">Log in or sign up</h2>
        <p className={gate.sub}>{NOTE}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onLogin}>Log in</button>
          <button type="button" className={styles.secondary} onClick={onSignup}>Sign up</button>
          <button type="button" className={styles.skip} onClick={onClose}>Continue browsing</button>
        </div>
      </div>
    </div>
  );
}

// The first thing a signed-out visitor sees on the booking site: log in or sign up, or close it and browse as a guest
export default function EntryLoginPrompt() {
  const account = useAccount();
  const openSignIn = useOpenClerkSignIn();
  const openSignUp = useOpenClerkSignUp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!account.ready) return;
    if (account.signedIn) {
      queueMicrotask(() => setOpen(false));
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === '1';
    } catch {}
    if (!seen) queueMicrotask(() => setOpen(true));
  }, [account.ready, account.signedIn]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {}
    setOpen(false);
  };

  if (!open) return null;
  if (!clerkEnabled) return <SignInGate onClose={dismiss} onDone={dismiss} note={NOTE} />;
  return (
    <ClerkChoice
      onClose={dismiss}
      onLogin={() => {
        dismiss();
        openSignIn();
      }}
      onSignup={() => {
        dismiss();
        openSignUp();
      }}
    />
  );
}
