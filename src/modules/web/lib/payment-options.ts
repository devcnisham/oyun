import { ValidationError } from '@/modules/shared/backend/errors';

export type PaymentOption = 'advance' | 'full';

/** Amount due on arrival, calculated from the server-priced total after discounts and wallet. */
export function paymentAmounts(total: number, option: unknown = 'advance') {
  if (option !== 'advance' && option !== 'full') throw new ValidationError('Choose 30% advance or full payment');
  if (!Number.isFinite(total) || total < 0) throw new ValidationError('Invalid booking total');
  const due = option === 'full' ? total : Math.round(total * .3);
  return { due, balance: total - due, percent: option === 'full' ? 100 : 30 };
}
