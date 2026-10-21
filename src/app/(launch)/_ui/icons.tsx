// One icon family for the launch pages: 24px grid, 1.75 stroke, round caps. Decorative (aria-hidden); the text beside each icon carries the meaning.
type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const });

export const IconArrow = ({ size = 18 }: P) => (<svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconClock = ({ size = 24 }: P) => (<svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const IconHourglass = ({ size = 24 }: P) => (<svg {...base(size)}><path d="M7 3h10M7 21h10M8 3c0 5 4 5 4 9s-4 4-4 9M16 3c0 5-4 5-4 9s4 4 4 9" /></svg>);
export const IconLayers = ({ size = 24 }: P) => (<svg {...base(size)}><path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5" /></svg>);
export const IconTicket = ({ size = 24 }: P) => (<svg {...base(size)}><path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v3ZM14 5v14" strokeDasharray="2 3" /></svg>);
export const IconUndo = ({ size = 24 }: P) => (<svg {...base(size)}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>);
export const IconStar = ({ size = 24 }: P) => (<svg {...base(size)}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" /></svg>);
export const IconCalendar = ({ size = 24 }: P) => (<svg {...base(size)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
export const IconUsers = ({ size = 24 }: P) => (<svg {...base(size)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></svg>);
export const IconChart = ({ size = 24 }: P) => (<svg {...base(size)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>);
export const IconBlock = ({ size = 24 }: P) => (<svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></svg>);
export const IconMenu = ({ size = 22 }: P) => (<svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = ({ size = 22 }: P) => (<svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconPlus = ({ size = 20 }: P) => (<svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>);
export const IconBall = ({ size = 28 }: P) => (<svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="m12 8 3.5 2.5-1.3 4h-4.4l-1.3-4L12 8ZM12 3v5M20.5 9.5 15.5 10.5M17.5 19l-3.3-4.5M6.5 19l3.3-4.5M3.5 9.5l5 1" /></svg>);
export const IconBat = ({ size = 28 }: P) => (<svg {...base(size)}><path d="m14 4 6 6-9.5 9.5a2.1 2.1 0 0 1-3 0l-3-3a2.1 2.1 0 0 1 0-3L14 4Z" /><path d="m3 21 4-4" /></svg>);
export const IconShuttle = ({ size = 28 }: P) => (<svg {...base(size)}><path d="M12 21c-2 0-3.5-1.4-3.5-3.2L7 9l5-2 5 2-1.5 8.8C15.5 19.6 14 21 12 21ZM7 9 4 3M17 9l3-6M12 7V3M9 13h6" /></svg>);
export const IconPaddle = ({ size = 28 }: P) => (<svg {...base(size)}><rect x="5" y="3" width="11" height="13" rx="5.5" /><path d="m12 16 5 5M9 7.5h3M9 10.5h3" /></svg>);
