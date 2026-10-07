'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { ActionResult } from '@/lib/types';
import styles from './dash.module.css';

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

interface ActionFormProps {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
  inline?: boolean;
}

// Wraps a server action form: disables inputs while pending and shows the result message
export default function ActionForm({ action, children, className, resetOnSuccess, confirm, inline }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className ?? (inline ? styles.inline : styles.form)}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <fieldset className={styles.fieldset} disabled={pending}>
        {children}
      </fieldset>
      {state?.error && <p role="alert" className={`${styles.message} ${styles.error}`}>{state.error}</p>}
      {state?.ok && <p role="status" className={`${styles.message} ${styles.success}`}>{state.ok}</p>}
    </form>
  );
}
