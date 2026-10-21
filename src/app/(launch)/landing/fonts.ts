import { Barlow, Barlow_Condensed } from 'next/font/google';

// Barlow Condensed gives the headlines their scoreboard weight; Barlow carries the reading text
export const display = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' });
export const body = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
