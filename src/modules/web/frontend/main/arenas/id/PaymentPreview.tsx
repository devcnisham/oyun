'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { rupees } from '@/modules/shared/lib/format';
import { ConfirmationMark, OyunLoader } from '@/modules/shared/frontend/OyunMotion';
import styles from './PaymentPreview.module.css';

const METHODS = [
  { id: 'upi', title: 'UPI', note: 'Pay with any UPI app', path: 'm7 4 9 8-9 8M13 4l9 8-9 8' },
  { id: 'card', title: 'Credit / Debit card', note: 'Visa, Mastercard, RuPay', path: 'M3 7h18M3 11h18M6 16h4M4 4h16a1 1 0 0 1 1 1v14H3V5a1 1 0 0 1 1-1Z' },
  { id: 'bank', title: 'Netbanking', note: 'Choose your bank', path: 'm3 8 9-5 9 5H3ZM5 11v7m7-7v7m7-7v7M3 21h18' },
  { id: 'venue', title: 'Pay at venue', note: 'Reserve without an online payment', path: 'M3 7h18v12H3V7Zm3-3h12M8 13h8M12 10v6' },
] as const;

export default function PaymentPreview({ amount, total, venue, full, pending, error, onBack, onReserve }: { amount: number; total: number; venue: string; full: boolean; pending: boolean; error: string; onBack: () => void; onReserve: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [method, setMethod] = useState<string>('upi');
  const [app, setApp] = useState('Google Pay');
  const [bank, setBank] = useState('HDFC');
  const [complete, setComplete] = useState(false);
  useEffect(() => { ref.current?.showModal(); }, []);
  return createPortal(<dialog ref={ref} className={styles.dialog} data-booking-checkout="true" aria-labelledby="payment-title" onCancel={e => { e.preventDefault(); if (!pending) onBack(); }}>
    <div className={styles.shell}>
      <header className={styles.header}><button type="button" disabled={pending} onClick={onBack} aria-label="Back to checkout"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button><b>Checkout</b><span>TEST MODE</span></header>
      <div className={styles.body}>
        <section className={styles.order}><div className={styles.merchant}><span className={styles.merchantMark}>O</span><div><b>{venue}</b><span>{full ? 'Full payment' : '30% advance'}</span></div><strong>{rupees(amount)}</strong></div><details><summary>View order details</summary><dl><div><dt>Booking total</dt><dd>{rupees(total)}</dd></div><div><dt>{full ? 'Full amount' : '30% advance'}</dt><dd>{rupees(amount)}</dd></div><div><dt>Remaining balance</dt><dd>{rupees(total - amount)}</dd></div></dl></details></section>
        <h1 id="payment-title">{complete ? 'Preview complete' : 'Payment methods'}</h1>
        {complete ? <section className={styles.result} role="status"><ConfirmationMark /><h2>No payment was collected</h2><p>This is a payment-screen preview. Your reservation has not been confirmed.</p><button type="button" className={styles.primary} onClick={() => setComplete(false)}>Choose another method</button></section> : <>
          <fieldset className={styles.methods} disabled={pending}><legend className="sr-only">Choose a payment method</legend>{METHODS.map(item => <div className={`${styles.method} ${method === item.id ? styles.selected : ''}`} key={item.id}><label><span className={styles.methodIcon}><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.path} /></svg></span><span className={styles.methodText}><b>{item.title}</b><small>{item.note}</small></span><input type="radio" name="paymentMethod" value={item.id} checked={method === item.id} onChange={() => setMethod(item.id)} /></label>
            {method === item.id && item.id === 'upi' && <div className={styles.methodBody}><div className={styles.apps} aria-label="UPI apps">{['Google Pay', 'PhonePe', 'Other UPI'].map((name, i) => <button key={name} type="button" aria-pressed={app === name} onClick={() => setApp(name)}><span className={styles.appMark} data-app={i} aria-hidden="true">{['G', 'P', 'UPI'][i]}</span><span>{name}</span></button>)}</div></div>}
            {method === item.id && item.id === 'card' && <div className={styles.methodBody}><div className={styles.demoCard}><span>Sample card</span><b>•••• &nbsp; •••• &nbsp; •••• &nbsp; 4242</b><div><span>MM / YY</span><span>•••</span></div></div><p className={styles.smallNote}>Card entry becomes available when online payments are connected.</p></div>}
            {method === item.id && item.id === 'bank' && <div className={styles.methodBody}><div className={styles.banks} aria-label="Bank preview">{['HDFC', 'ICICI', 'SBI', 'Axis'].map(name => <button type="button" key={name} aria-pressed={bank === name} onClick={() => setBank(name)}>{name}</button>)}</div></div>}
          </div>)}</fieldset>
          {error && <p role="alert" className={styles.error}>{error}</p>}
        </>}
      </div>
      {!complete && <footer className={styles.footer}><div className={styles.footerAmount}><strong>{rupees(amount)}</strong><span>{full ? 'Full payment' : '30% advance'}</span></div><button type="button" className={styles.primary} disabled={pending} onClick={() => method === 'venue' ? onReserve() : setComplete(true)}>{pending ? <OyunLoader compact label="Confirming booking…" /> : method === 'venue' ? 'Confirm reservation' : 'Continue'}</button><p>{method === 'venue' ? 'No online payment will be collected.' : 'Test checkout · No money will be collected.'}</p></footer>}
    </div>
  </dialog>, document.body);
}
