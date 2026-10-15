import type { Offer, PlatformOffer, PlatformSettings, Player } from './types';

export const DEFAULT_PLATFORM_OFFERS: { regular: PlatformOffer; student: PlatformOffer } = {
  regular: { active: false, title: 'OYUN offer', percentOff: 10 },
  student: { active: false, title: 'Student offer', percentOff: 15 },
};

export const PLATFORM_OFFER_MAX_PERCENT = 90;

/** The two offers with any missing values filled in, so older data without them still works. */
export function platformOffersOf(settings: Pick<PlatformSettings, 'platformOffers'>) {
  return {
    regular: { ...DEFAULT_PLATFORM_OFFERS.regular, ...settings.platformOffers?.regular },
    student: { ...DEFAULT_PLATFORM_OFFERS.student, ...settings.platformOffers?.student },
  };
}

/** A player gets the student price only after an admin has approved their ID. */
export const isApprovedStudent = (player: Pick<Player, 'student'> | undefined | null) => player?.student?.status === 'approved';

/**
 * The platform offers that apply to this booking, shaped like turf offers so the same "best single offer"
 * rule picks between them. The regular offer is for everyone; the student offer only for approved students.
 */
export function platformOffersFor(settings: Pick<PlatformSettings, 'platformOffers'>, turfId: string, student: boolean): Offer[] {
  const { regular, student: studentOffer } = platformOffersOf(settings);
  const make = (type: 'regular' | 'student', o: PlatformOffer): Offer => ({
    id: `platform_${type}`,
    turfId,
    type,
    title: o.title,
    percentOff: o.percentOff,
    startHour: 0,
    endHour: 24,
    active: o.active,
    createdAt: '',
  });
  return [make('regular', regular), ...(student ? [make('student', studentOffer)] : [])];
}

/** Reads and checks one offer from the admin form. `prefix` is "regular" or "student". */
export function parsePlatformOfferForm(get: (key: string) => string, prefix: 'regular' | 'student'): PlatformOffer {
  const title = get(`${prefix}Title`).trim();
  if (!title) throw new Error('Give each offer a name');
  if (title.length > 40) throw new Error('Offer names can be at most 40 characters');
  const percentOff = Number(get(`${prefix}Percent`));
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > PLATFORM_OFFER_MAX_PERCENT) {
    throw new Error(`Discount must be a whole number from 1 to ${PLATFORM_OFFER_MAX_PERCENT}`);
  }
  return { active: get(`${prefix}Active`) === 'on', title, percentOff };
}
