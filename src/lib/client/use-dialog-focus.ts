'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, oldest first: only the top one reacts to keys (the sign-in gate opens over checkout)
const open: HTMLElement[] = [];

/**
 * Keyboard behaviour for a modal dialog: focus moves into it on open, Tab stays inside it, Escape closes it
 * (unless `canClose` is false) and focus goes back to what opened it. Attach the returned ref to the dialog element.
 */
export function useDialogFocus<T extends HTMLElement>(onClose: () => void, canClose = true) {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  const allowed = useRef(canClose);
  // Keep the latest callbacks without re-running the focus effect below
  useEffect(() => {
    close.current = onClose;
    allowed.current = canClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    open.push(dialog);
    const items = () => [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    // The first field if there is one, else the dialog itself, so a screen reader starts reading inside it
    const first = items().find((el) => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) ?? items()[0];
    if (first) first.focus();
    else {
      dialog.tabIndex = -1;
      dialog.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (open[open.length - 1] !== dialog) return;
      if (e.key === 'Escape' && allowed.current) {
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) return e.preventDefault();
      const active = document.activeElement;
      const at = list.indexOf(active as HTMLElement);
      if (e.shiftKey && (at <= 0 || !dialog.contains(active))) {
        e.preventDefault();
        list[list.length - 1].focus();
      } else if (!e.shiftKey && (at === list.length - 1 || !dialog.contains(active))) {
        e.preventDefault();
        list[0].focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      open.splice(open.indexOf(dialog), 1);
      // The opener may have been replaced while the dialog was open; fall back to the page's main region
      const target = opener && document.contains(opener) ? opener : document.getElementById('main');
      target?.focus();
    };
  }, []);

  return ref;
}
