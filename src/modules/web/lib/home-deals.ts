import type { Offer } from '@/modules/shared/database/types';

export function homeDeals(offers: Offer[], publicVenueIds: Set<string>) {
  return offers.filter(o =>
    o.active && o.type === 'happy_hour' && publicVenueIds.has(o.turfId) &&
    Number.isFinite(o.percentOff) && o.percentOff > 0 && o.percentOff <= 100 &&
    Number.isInteger(o.startHour) && Number.isInteger(o.endHour) &&
    o.startHour >= 0 && o.endHour <= 24 && o.startHour < o.endHour &&
    o.startHour < 17 && o.endHour > 5,
  ).map(o => ({
    ...o,
    period: o.startHour < 12 && o.endHour > 12 ? 'Morning & afternoon' : o.startHour < 12 ? 'Morning' : 'Afternoon',
  }));
}
