// Price-band landing pages ("turfs under 700 in Mangalore"). A band only becomes a page when a real venue fits it.
export const PRICE_BANDS = [500, 700, 1000] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

export const bandFromSlug = (slug: string): PriceBand | null => {
  const m = /^under-(\d+)$/.exec(slug);
  const n = m ? Number(m[1]) : NaN;
  return (PRICE_BANDS as readonly number[]).includes(n) ? (n as PriceBand) : null;
};
export const bandSlug = (band: PriceBand) => `under-${band}`;
