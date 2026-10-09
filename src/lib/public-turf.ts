import type { PublicTurf, Turf } from './types';

// Everything that is sent to the browser about a turf goes through here, so internal fields
// (the owner account link and the commission deal) can never reach a client component.
export function toPublicTurf(turf: Turf): PublicTurf {
  const pub: Partial<Turf> = { ...turf };
  delete pub.partnerId;
  delete pub.commissionPercent;
  return pub as PublicTurf;
}
