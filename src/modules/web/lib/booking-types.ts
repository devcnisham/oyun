import type { PaymentOption } from './payment-options';
// Booking request/quote shapes, the slot limit and request cleaning. Nothing here touches the store,
// so client components (the booking screen), server actions and tests can all import it.
import { ValidationError } from '@/modules/shared/backend/errors';
import type { BookingAddOn, PitchSide, PitchSize, PriceLine } from '@/modules/shared/database/types';

/** Most slots a player can hold or book in one go. */
export const MAX_SLOTS = 6;

export function cleanHours(hours: unknown): number[] {
  if (!Array.isArray(hours)) throw new ValidationError('Pick at least one slot');
  const clean = [...new Set(hours.map(Number))].filter((h) => Number.isInteger(h) && h >= 0 && h <= 23).sort((a, b) => a - b);
  if (clean.length === 0) throw new ValidationError('Pick at least one slot');
  if (clean.length > MAX_SLOTS) throw new ValidationError(`You can book up to ${MAX_SLOTS} slots at a time`);
  return clean;
}

export const cleanSize = (size: unknown): PitchSize => (size === 'half' ? 'half' : 'full');
export const cleanSide = (side: unknown): PitchSide | undefined => (side === 'A' || side === 'B' ? side : undefined);

export interface SelectionRequest {
  paymentOption?: PaymentOption;
  turfId: string;
  date: string;
  hours: number[];
  promoCode: string | null;
  addOns: { id: string; qty: number }[];
  useWallet: boolean;
  phone: string;
  size?: PitchSize; // full pitch (default) or one half
  side?: PitchSide; // which half, when the player chose one
}

export interface BookingRequest extends SelectionRequest {
  name: string;
  referralCode?: string | null;
}

export interface SelectionQuote {
  slots: { hour: number; label: string; price: number }[];
  slotTotal: number; // slot prices after peak/weekend/last-minute pricing
  adjustments: PriceLine[]; // owner offers and promo, summed across slots
  addOns: BookingAddOn[];
  addOnTotal: number;
  walletBalance: number;
  walletDeduction: number;
  total: number;
  advancePercent: number;
  minAdvance: number;
  maxAdvance: number;
  payNow: number;
  payAtVenue: number;
  promoCode: string | null;
  promoError: string | null;
  slotError: string | null;
}
