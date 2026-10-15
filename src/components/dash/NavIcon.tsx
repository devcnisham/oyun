// Line icons for the dashboard sidebars (24px grid, 1.75 stroke, inherits the link colour).
const PATHS: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  bookings: <><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 3v3M16 3v3" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 3v3M16 3v3M8 14h2M14 14h2M8 17.5h2" /></>,
  checkin: <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M8 12h8" /></>,
  slots: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pricing: <><path d="M4 17l5-5 4 4 7-8" /><path d="M15 8h5v5" /></>,
  reviews: <path d="M12 3.5l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.9l6-.9z" />,
  offers: <><path d="M3 12.5V4h8.5L21 13.5 13.5 21z" /><circle cx="8" cy="9" r="1.2" /></>,
  addons: <><path d="M5 8h14l-1.5 12h-11z" /><path d="M8.5 8a3.5 3.5 0 0 1 7 0" /></>,
  payouts: <><rect x="3" y="6" width="18" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.5" /><path d="M6.5 9.5v.01M17.5 14.5v.01" /></>,
  staff: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.5-3.6 3-5.5 6-5.5s5.5 1.9 6 5.5" /><path d="M16 5a3 3 0 0 1 0 6M17.5 14.8c1.7.6 3 2.2 3.5 5.2" /></>,
  turf: <><path d="M3 20h18M5 20V9l7-5 7 5v11" /><path d="M10 20v-5h4v5" /></>,
  courts: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 5v14" /><circle cx="12" cy="12" r="2.5" /></>,
  site: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.500 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></>,
  shield: <><path d="M12 3l7.500 3v5.500c0 4.600-3.100 8.200-7.500 9.500-4.400-1.300-7.500-4.900-7.500-9.500V6z" /><path d="M9 12l2.200 2.200L15.500 10" /></>,
  turfs: <><path d="M3 20h18M5 20V9l7-5 7 5v11" /><path d="M10 20v-5h4v5" /></>,
  partners: <><path d="M3 12l4-4 4 3 4-3 6 5-4.500 4.500a2 2 0 0 1-2.800 0L12 15l-2 2a2 2 0 0 1-2.800 0z" /></>,
  players: <><circle cx="9" cy="8" r="3.200" /><path d="M3 20c.5-3.600 3-5.500 6-5.500s5.500 1.900 6 5.500" /><path d="M16 5a3 3 0 0 1 0 6M17.500 14.800c1.700.6 3 2.200 3.500 5.200" /></>,
  students: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11.500V16c0 1.500 2.700 3 6 3s6-1.500 6-3v-4.500" /></>,
  transactions: <><rect x="3" y="5" width="18" height="14" rx="2.500" /><path d="M3 10h18M7 15h3" /></>,
  analytics: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100" /></>,
  homepage: <><rect x="3" y="4" width="18" height="16" rx="2.500" /><path d="M3 9h18M7 14h6" /></>,
};

export type NavIconName = keyof typeof PATHS;

export default function NavIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name] ?? PATHS.dashboard}
    </svg>
  );
}
