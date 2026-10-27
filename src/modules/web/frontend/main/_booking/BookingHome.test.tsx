import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { seed } from '@/modules/shared/database/seed';
import type { Offer, SponsorAd } from '@/modules/shared/database/types';
import BookingHome from './BookingHome';

const turf = { ...seed().turfs[0], availableToday: 3 };
const offer: Offer = { id: 'morning', turfId: turf.id, type: 'happy_hour', title: 'Morning practice', percentOff: 20, startHour: 6, endHour: 11, active: true, createdAt: '' };
const ad: SponsorAd = { id: 'sponsor', brand: 'Test sponsor', title: 'Sponsor message', subtitle: 'Test creative', image: '', link: 'https://example.com/sport' };

test('displays valid happy-hour deals and clearly identifies paid sponsor content', () => {
  const html = renderToStaticMarkup(<BookingHome turfs={[turf]} offers={[offer]} ads={[ad]} />);
  expect(html).toContain('20');
  expect(html).toContain('Morning practice');
  expect(html).toContain('On eligible slots');
  expect(html).toContain('Test sponsor');
  expect(html).toContain('rel="sponsored noopener"');
  expect(html).toContain('href="https://example.com/sport"');
});

test('does not fabricate discounts, sponsorships or review ratings in empty states', () => {
  const html = renderToStaticMarkup(<BookingHome turfs={[{ ...turf, reviewCount: 0, rating: 5 }]} offers={[]} ads={[]} />);
  expect(html).not.toContain('Regular starting rates shown');
  expect(html).toContain('Regular starting rate');
  expect(html).not.toContain('From our sponsors');
  expect(html).not.toContain('out of 5 from');
  expect(html).not.toContain('% off');
});

test('renders an honest venue empty state and rejects executable sponsor destinations', () => {
  const html = renderToStaticMarkup(<BookingHome turfs={[]} offers={[offer]} ads={[{ ...ad, link: 'javascript:alert(1)' }]} />);
  expect(html).toContain('New venues are on the way');
  expect(html).not.toContain('javascript:');
  expect(html).not.toContain('Morning practice');
});
