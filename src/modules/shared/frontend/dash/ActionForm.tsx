'use client';

import { useActionState, useEffect, useLayoutEffect, useRef } from 'react';
import type { ActionResult } from '@/modules/shared/database/types';
import styles from '@/modules/shared/frontend/dash/dash.module.css';

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
  const submitted = useRef<FormData | null>(null);
  const [state, formAction, pending] = useActionState(async (prev: ActionResult, fd: FormData) => {
    submitted.current = fd;
    return action(prev, fd);
  }, null);
  const formRef = useRef<HTMLFormElement>(null);

  // React 19 resets uncontrolled fields once an action finishes. After a validation error the
  // person should not have to retype everything, so put back what they had submitted.
  useLayoutEffect(() => {
    const form = formRef.current;
    const fd = submitted.current;
    if (!state?.error || !form || !fd) return;
    for (const [name, value] of fd.entries()) {
      if (typeof value !== 'string') continue;
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement) {
        if (['hidden', 'password', 'file', 'checkbox', 'radio'].includes(field.type)) continue;
        field.value = value;
      } else if (field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
        field.value = value;
      }
    }
  }, [state]);

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
