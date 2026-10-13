import { describe, expect, it } from 'vitest';
import { mapTurfToVenue } from './data-mapping';
import type { Turf } from './types';

const baseTurf: Turf = {
  id: 'test-turf',
  name: 'Test Turf',
  location: 'Kodialbail, Mangalore',
  area: 'Kodialbail',
  city: 'Mangalore',
  rating: 4.8,
  reviewCount: 20,
  pricePerHour: 1000,
  sports: ['Football'],
  amenities: ['Floodlights', 'Parking'],
  size: '6-a-side',
  formats: ['5-a-side', '6-a-side'],
  surface: 'Artificial Grass',
  openTime: '06:00',
  closeTime: '23:00',
  images: ['/turfs/turf_0.jpg'],
  isVerified: true,
  isFeatured: false,
  description: 'A great football turf.',
  ownerName: 'Owner',
  phone: '9876543210',
  status: 'active',
  partnerId: 'partner_1',
  commissionPercent: 10,
  createdAt: '2026-10-01T00:00:00Z',
};

describe('mapTurfToVenue', () => {
  it('maps plain turf to one resource and one bookable', () => {
    const mapped = mapTurfToVenue(baseTurf);
    expect(mapped.venue.slug).toBe('test-turf');
    expect(mapped.resources).toHaveLength(1);
    expect(mapped.resources[0].name).toBe('Main Pitch');
    expect(mapped.bookables).toHaveLength(1);
    expect(mapped.bookables[0].name).toBe('Full pitch');
    expect(mapped.bookables[0].resourceNames).toEqual(['Main Pitch']);
    expect(mapped.bookables[0].basePrice).toBe(1000);
  });

  it('maps halfPitch turf to Half A, Half B resources and three bookables', () => {
    const halfTurf: Turf = {
      ...baseTurf,
      halfPitch: true,
      halfPricePercent: 55,
      pricePerHour: 1200,
    };
    const mapped = mapTurfToVenue(halfTurf);
    expect(mapped.resources).toHaveLength(2);
    expect(mapped.resources.map((r) => r.name)).toEqual(['Half A', 'Half B']);
    expect(mapped.bookables).toHaveLength(3);
    const names = mapped.bookables.map((b) => b.name);
    expect(names).toContain('Full pitch');
    expect(names).toContain('Half pitch A');
    expect(names).toContain('Half pitch B');

    const full = mapped.bookables.find((b) => b.name === 'Full pitch')!;
    expect(full.basePrice).toBe(1200);
    expect(full.resourceNames).toEqual(['Half A', 'Half B']);

    const halfA = mapped.bookables.find((b) => b.name === 'Half pitch A')!;
    expect(halfA.basePrice).toBe(660); // 1200 * 55% = 660
    expect(halfA.resourceNames).toEqual(['Half A']);
  });

  it('maps badminton and pickleball facility to courts with appropriate slot lengths', () => {
    const racketTurf: Turf = {
      ...baseTurf,
      sports: ['Badminton', 'Pickleball'],
      pricePerHour: 500,
    };
    const mapped = mapTurfToVenue(racketTurf);
    expect(mapped.resources).toHaveLength(2);
    expect(mapped.resources.map((r) => r.name)).toEqual(['Court 1', 'Court 2']);

    const bd = mapped.bookables.filter((b) => b.sport === 'badminton');
    expect(bd).toHaveLength(2);
    expect(bd[0].slotMinutes).toBe(60);

    const pb = mapped.bookables.filter((b) => b.sport === 'pickleball');
    expect(pb).toHaveLength(2);
    expect(pb[0].slotMinutes).toBe(30);
  });
});
