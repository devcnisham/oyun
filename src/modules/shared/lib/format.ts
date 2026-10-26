// Display formatters shared by public pages, dashboards and invoices. Client-safe: no server imports.

/** Indian rupees with lakh grouping, e.g. 125000 → "₹1,25,000". Missing values show as ₹0. */
export const rupees = (n: number | null | undefined) => `₹${(n ?? 0).toLocaleString('en-IN')}`;

/** 12-hour label for a whole hour, e.g. 19 → "7 PM". Hour 24 reads as "12 AM". */
export const shortHour = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;
