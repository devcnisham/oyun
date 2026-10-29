export interface SplitResult {
  playerCount: number;
  perPerson: number;
  total: number;
}

export interface UpiLinkOptions {
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}

export interface SplitShareDetails {
  turfName: string;
  date: string;
  timeSlot: string;
  totalAmount: number;
  playerCount: number;
  perPerson: number;
  upiLink?: string;
}

/**
 * Validates a standard Indian Unified Payments Interface (UPI) Virtual Payment Address (VPA) / ID.
 * Example: `9876543210@upi`, `player@okhdfcbank`, `turf.team@icici`.
 */
export function isValidUpiId(upiId: string): boolean {
  if (typeof upiId !== 'string') return false;
  const clean = upiId.trim();
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(clean);
}

/**
 * Calculates per-person split for a game.
 * Uses ceil to avoid shortfall for the host, ensuring the total collected covers the slot.
 */
export function calculateSplit(totalAmount: number, playerCount: number): SplitResult {
  const total = Math.max(0, Math.round(Number(totalAmount) || 0));
  const count = Math.max(1, Math.min(50, Math.round(Number(playerCount) || 1)));
  const perPerson = Math.ceil(total / count);

  return {
    playerCount: count,
    perPerson,
    total,
  };
}

/**
 * Generates an Indian standard UPI payment deep link intent url.
 * When tapped on mobile devices (Android / iOS), opens Google Pay, PhonePe, Paytm, or BHIM.
 */
export function generateUpiLink({ upiId, payeeName, amount, note }: UpiLinkOptions): string {
  const cleanUpi = upiId.trim();
  const cleanName = payeeName.trim().slice(0, 50) || 'OYUN Player';
  const cleanAmt = Math.max(0, Math.round(Number(amount) || 0));
  const cleanNote = (note || 'Turf game share').trim().slice(0, 80);

  const params = new URLSearchParams({
    pa: cleanUpi,
    pn: cleanName,
    am: cleanAmt.toString(),
    cu: 'INR',
    tn: cleanNote,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates a clean, friendly message suitable for sharing with teammates on WhatsApp.
 */
export function generateSplitShareMessage({
  turfName,
  date,
  timeSlot,
  totalAmount,
  playerCount,
  perPerson,
  upiLink,
}: SplitShareDetails): string {
  const lines = [
    ` *Slot Booked at ${turfName}*`,
    ` ${date} ·  ${timeSlot}`,
    ` Total: ₹${totalAmount} split among ${playerCount} players`,
    ` *Your share: ₹${perPerson}*`,
  ];

  if (upiLink) {
    lines.push(`\nPay your share via UPI:\n${upiLink}`);
  }

  lines.push('\nSee you on the pitch! ');

  return lines.join('\n');
}
