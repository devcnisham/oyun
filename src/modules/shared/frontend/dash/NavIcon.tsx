// Line icons for the dashboard sidebars (24px grid, 1.75 stroke, inherits the link colour).
const PATHS: Record<string, React.ReactNode> = {
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  rain: <><path d="M7 15a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 8.5 3.5 3.5 0 0 1 17.5 15z" /><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" /></>,
  tool: <path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.500-5.500a4 4 0 0 0 5-5L15 12l-3-3z" />,
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20h6" />,
  bolt: <path d="M13 3L5 14h6l-1 7 8-11h-6z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  external: <path d="M7 17L17 7M9 7h8v8" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  ball: <><circle cx="12" cy="12" r="9" /><path d="M12 7.500l3.500 2.500-1.300 4.200H9.800L8.500 10z" /><path d="M12 7.500V3M15.500 10l4.200-1.500M14.200 14.200l2.500 3.500M9.800 14.200l-2.500 3.500M8.500 10L4.300 8.500" /></>,
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

export default function NavIcon({ name, className, size = 20 }: { name: string; className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name] ?? PATHS.dashboard}
    </svg>
  );
}
