import { useCallback, useEffect, useMemo, useState } from 'react';
import { checkReferralCode, quoteSelection, type ReferralCheck } from '@/lib/booking-actions';
import type { SelectionQuote } from '@/lib/booking-types';
import { getProfile } from '@/lib/client/device';
import type { PitchSize } from '@/lib/types';

interface CheckoutFormOptions {
  turfId: string;
  date: string;
  hours: number[];
  size: PitchSize;
  /** Quote the selection only while the checkout sheet is open. */
  active: boolean;
  referralEnabled: boolean;
  initialCode: string;
  account: { ready: boolean; name: string; phone: string };
}

/**
 * Player details, offer codes, wallet toggle and the server-priced quote for the checkout sheet.
 * The server prices the exact booking whenever these inputs change, so the bill never drifts
 * from what booking charges.
 */
export function useCheckoutForm({ turfId, date, hours, size, active, referralEnabled, initialCode, account }: CheckoutFormOptions) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCodeValue] = useState(initialCode);
  const [promo, setPromo] = useState<string | null>(null);
  const [referral, setReferral] = useState<ReferralCheck | null>(null);
  const [codeError, setCodeError] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [quote, setQuote] = useState<SelectionQuote | null>(null);
  const [error, setError] = useState('');

  const phoneDigits = phone.replace(/\D/g, '').slice(-10);
  const codeApplied = promo !== null || referral?.status === 'valid';

  // What the server needs to price or book the current selection
  const base = useMemo(() => ({ turfId, date, hours, addOns: [], useWallet, size }), [turfId, date, hours, useWallet, size]);

  // Fill in the signed-in player's name and number
  useEffect(() => {
    if (!account.ready) return;
    const profile = getProfile();
    queueMicrotask(() => {
      setName((n) => n || account.name || profile.name);
      setPhone((n) => n || account.phone || profile.phone);
    });
  }, [account.ready, account.name, account.phone]);

  // Server prices the exact booking whenever checkout inputs change
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await quoteSelection({ ...base, promoCode: promo, phone: phoneDigits });
      if (cancelled) return;
      if ('error' in result) setError(result.error);
      else setQuote(result);
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, base, promo, phoneDigits]);

  const setCode = (value: string) => {
    setCodeValue(value);
    setCodeError('');
  };

  /** Applies the typed code as a promo or a referral; calling it again removes the applied code. */
  const applyCode = async () => {
    if (codeApplied) {
      setPromo(null);
      setReferral(null);
      setCodeValue('');
      setCodeError('');
      return;
    }
    const entered = code.trim().toUpperCase();
    if (!entered) return;
    const tryPromo = await quoteSelection({ ...base, promoCode: entered, phone: phoneDigits });
    if (!('error' in tryPromo) && tryPromo.promoCode && !tryPromo.promoError) {
      setPromo(tryPromo.promoCode);
      setCodeError('');
      return;
    }
    if (referralEnabled) {
      const check = await checkReferralCode(entered, phoneDigits);
      if (check.status === 'valid') {
        setReferral(check);
        setCodeError('');
        return;
      }
      if (check.status === 'not_new') {
        setCodeError("Referral codes are for a player's first booking only.");
        return;
      }
    }
    setCodeError(('error' in tryPromo ? null : tryPromo.promoError) ?? 'Invalid promo or referral code');
  };

  /** Clears the priced quote and any message when the sheet closes. */
  const reset = useCallback(() => {
    setQuote(null);
    setError('');
  }, []);

  return {
    name, setName,
    phone, setPhone, phoneDigits,
    code, setCode, codeError, codeApplied, applyCode,
    promo, referral,
    useWallet, setUseWallet,
    quote, error, setError,
    base,
    reset,
  };
}

export type CheckoutForm = ReturnType<typeof useCheckoutForm>;
