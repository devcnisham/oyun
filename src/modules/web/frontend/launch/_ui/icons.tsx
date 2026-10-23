// One icon family for the launch pages: 24px grid, 1.75 stroke, round caps. Decorative (aria-hidden); the text beside each icon carries the meaning.
type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const });

export const IconArrow = ({ size = 18 }: P) => (<svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconClose = ({ size = 22 }: P) => (<svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconMenu = ({ size = 22 }: P) => (<svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconPlus = ({ size = 20 }: P) => (<svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>);
