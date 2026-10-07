'use client';

import { useEffect, useState } from 'react';
import ActionForm from '@/components/dash/ActionForm';
import { dash } from '@/components/dash/ui';
import { createWalkIn, getWalkInSlots } from '@/lib/partner-actions';
import type { AddOn, Slot } from '@/lib/types';

interface WalkInFormProps {
  turfId: string;
  today: string;
  maxDate: string;
  addOns: AddOn[];
}

export default function WalkInForm({ turfId, today, maxDate, addOns }: WalkInFormProps) {
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getWalkInSlots(date)
      .then((s) => {
        if (!cancelled) setSlots(s);
      })
      .catch(() => {
        if (!cancelled) setSlots([]); // never leave the picker on "Loading…"
      });
    return () => {
      cancelled = true;
    };
  }, [turfId, date, version]); // turfId: reload when the owner switches turf

  const available = (slots ?? []).filter((s) => s.available);

  return (
    <ActionForm
      action={async (prev, fd) => {
        const res = await createWalkIn(prev, fd);
        setVersion((v) => v + 1); // refresh slot list
        return res;
      }}
      resetOnSuccess
    >
      <div className={dash.formGrid}>
        <label className={dash.field}>
          <span className={dash.label}>Customer name</span>
          <input name="name" required className={dash.input} placeholder="e.g. Rahul" />
        </label>
        <label className={dash.field}>
          <span className={dash.label}>Mobile number</span>
          <input name="phone" required inputMode="numeric" className={dash.input} placeholder="10 digits" />
        </label>
        <label className={dash.field}>
          <span className={dash.label}>Date</span>
          <input name="date" type="date" required min={today} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} className={dash.input} />
        </label>
        <label className={dash.field}>
          <span className={dash.label}>Slot</span>
          <select name="hour" required className={dash.select} disabled={slots === null}>
            {slots === null && <option>Loading…</option>}
            {slots !== null && available.length === 0 && <option value="">No free slots</option>}
            {available.map((s) => (
              <option key={s.hour} value={s.hour}>{s.label} — ₹{s.price}</option>
            ))}
          </select>
        </label>
        <label className={dash.field}>
          <span className={dash.label}>Payment collected</span>
          <select name="paymentMode" className={dash.select}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
          </select>
        </label>
      </div>
      {addOns.length > 0 && (
        <div className={dash.formGrid}>
          {addOns.map((a) => (
            <label key={a.id} className={dash.field}>
              <span className={dash.label}>{a.name} (₹{a.price})</span>
              <input name={`addon_${a.id}`} type="number" min={0} max={20} defaultValue={0} className={dash.input} />
            </label>
          ))}
        </div>
      )}
      <div className={dash.actions}>
        <button type="submit" className={dash.btn} disabled={available.length === 0}>Create walk-in booking</button>
        <span className={dash.muted}>Walk-ins use your normal dynamic prices; online offers don&apos;t apply.</span>
      </div>
    </ActionForm>
  );
}
