import { Sora } from 'next/font/google';

// Display face for headlines and numbers: geometric, wide and sporty. Body text is Inter, already loaded for the whole site (--font-inter).
export const display = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display', display: 'swap' });
