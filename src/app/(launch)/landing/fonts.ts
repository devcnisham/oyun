import { Instrument_Serif } from 'next/font/google';

// One refined serif for headlines; the body text is Inter, already loaded for the whole site (--font-inter)
export const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
