// Display formatters shared by public pages, dashboards and invoices. Client-safe: no server imports.

/** Indian rupees with lakh grouping, e.g. 125000 → "₹1,25,000". Missing values show as ₹0. */
export const rupees = (n: number | null | undefined) => `₹${(n ?? 0).toLocaleString('en-IN')}`;

/** 12-hour label for a whole hour, e.g. 19 → "7 PM", 24 → "12 AM", 25 → "1 AM". */
export const shortHour = (h: number) => {
  const norm = ((h % 24) + 24) % 24;
  return `${norm % 12 === 0 ? 12 : norm % 12} ${norm < 12 ? 'AM' : 'PM'}`;
};

