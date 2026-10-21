import type { PublicTurf } from './types';

export interface CuratedCollection {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  lead: string;
  badge: string;
  icon: string;
  filter: (turf: PublicTurf) => boolean;
  editorialTips: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
}

export const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    slug: 'night-turfs-mangalore',
    title: 'Best Night Turfs in Mangalore (Open Past Midnight)',
    metaTitle: 'Night Turfs in Mangalore | 24/7 & Late Night Floodlight Turfs',
    metaDescription: 'Find and book the best late night football and box cricket turfs in Mangalore. High-intensity LED floodlights, midnight slots, and instant booking on OYUN.',
    lead: "Mangalore's sports culture thrives after sundown. Whether you're organizing a post-work 5v5 football clash or a midnight box cricket championship under high-lux floodlights, these verified venues offer prime slots after 10 PM and past midnight.",
    badge: 'Open After Dark',
    icon: '🌙',
    filter: (t) => {
      const closesLate = t.closeTime === '00:00' || t.closeTime >= '23:00' || t.closeTime <= '04:00';
      const hasLights = t.amenities.some((a) => a.toLowerCase().includes('light') || a.toLowerCase().includes('flood'));
      return closesLate || hasLights;
    },
    editorialTips: [
      {
        title: 'Peak Night Hours',
        desc: 'Slots between 8:00 PM and 11:00 PM book out 24 to 48 hours in advance, especially on Friday and Saturday nights.',
      },
      {
        title: 'Ball Visibility',
        desc: 'For late night box cricket, ask the venue for optic yellow or fluorescent tennis balls for optimal visibility under LED floodlights.',
      },
      {
        title: 'Noise Regulations',
        desc: 'Residential venues enforce polite play after 11 PM: avoid loud music and respect nearby neighborhoods while enjoying intense matches.',
      },
    ],
    faqs: [
      {
        q: 'Which turfs in Mangalore are open for matches after midnight?',
        a: 'Venues in Bejai, Kadri, Pandeshwar, and Neermarga feature late-night operations with slots available up to 12 AM and beyond. Check live slot pickers on OYUN for exact closing times.',
      },
      {
        q: 'Are night slot rates higher than daytime rates?',
        a: 'Yes, peak night slots (7 PM - 11 PM) usually command standard peak rates of ₹900 - ₹1,400/hr, whereas early morning or afternoon slots can be up to 30% cheaper.',
      },
      {
        q: 'Do floodlit turfs charge an extra fee for lighting?',
        a: 'No, all hourly rates displayed on OYUN are fully inclusive of floodlights, bibs, and pitch maintenance with no hidden generator surcharges.',
      },
    ],
  },
  {
    slug: 'monsoon-covered-turfs-mangalore',
    title: 'Rainproof & Covered Sports Turfs in Mangalore',
    metaTitle: 'Covered & Indoor Turfs in Mangalore | Monsoon Sports Booking',
    metaDescription: 'Don’t let heavy coastal rains cancel your game. Discover covered football turfs, indoor badminton courts, and rainproof pickleball venues in Mangalore on OYUN.',
    lead: 'Mangalore receives over 3,000mm of monsoon rain between June and September. These covered indoor arenas and high-grade drainage facilities ensure uninterrupted matches through even the heaviest coastal downpours.',
    badge: '100% Monsoon Proof',
    icon: '🌧️',
    filter: (t) => {
      const isIndoorSport = t.sports.some((s) => s.toLowerCase().includes('badminton') || s.toLowerCase().includes('pickleball'));
      const hasCover = t.amenities.some((a) => a.toLowerCase().includes('indoor') || a.toLowerCase().includes('covered'));
      return isIndoorSport || hasCover;
    },
    editorialTips: [
      {
        title: 'Shoe Grip on Wet Grass',
        desc: 'If playing on open-air drainage turfs in drizzle, use rubber multi-stud turf shoes (TF) rather than worn sneakers to prevent slipping.',
      },
      {
        title: 'Indoor Humidity Control',
        desc: 'Venues like OneLve Pickleball (Bharath Mall) and Urwa Indoor Stadium feature ventilation that protects against tropical humidity.',
      },
      {
        title: 'Changing Rooms',
        desc: 'Look for venues with covered shower facilities so you can dry off and change immediately after your session.',
      },
    ],
    faqs: [
      {
        q: 'What happens if it rains heavily during my outdoor turf booking?',
        a: 'Top turfs in Mangalore feature rapid sub-surface gravel drainage that clears standing water within 15 minutes. For unplayable storms, venues offer rescheduling or wallet refunds under OYUN rain-out policies.',
      },
      {
        q: 'Where can I play sports completely indoors in Mangalore?',
        a: 'For 100% weather-independent play, book indoor badminton at Urwa Indoor Stadium or Mangala Magnus, or indoor pickleball on the 6th floor of Bharath Mall (Bejai).',
      },
    ],
  },
  {
    slug: 'wooden-badminton-courts-mangalore',
    title: 'Top Wooden Badminton Courts in Mangalore',
    metaTitle: 'Best Wooden Badminton Courts in Mangalore | Teak Wood Flooring',
    metaDescription: 'Book premium wooden badminton courts in Mangalore. Experience Brazilian teak wood flooring, certified shock absorption, and instant hourly court booking.',
    lead: 'For dedicated shuttle enthusiasts, natural wood provides the gold standard in joint cushioning, predictable shuttle rebounds, and authentic playing rhythm. Compare Mangalore’s premier wooden court facilities.',
    badge: 'Pro Wooden Flooring',
    icon: '🏸',
    filter: (t) => {
      return t.sports.some((s) => s.toLowerCase().includes('badminton'));
    },
    editorialTips: [
      {
        title: 'Non-Marking Footwear Mandatory',
        desc: 'Strictly use non-marking gum sole shoes. Black rubber or outdoor running shoes leave indelible scuffs and will be denied entry by court marshals.',
      },
      {
        title: 'Morning Flight Sessions',
        desc: 'Natural wood courts have optimal traction in the early morning between 6:00 AM and 9:00 AM before ambient coastal humidity rises.',
      },
      {
        title: 'Shuttlecock Durability',
        desc: 'High-ceiling wooden halls with good airflow extend feather shuttlecock life compared to cramped low-clearance spaces.',
      },
    ],
    faqs: [
      {
        q: 'Why choose wooden flooring over synthetic mats for badminton?',
        a: 'Teak wood sub-floors feature air-cushioned sleeper systems that absorb knee and lower back impact during heavy jump smashes, significantly reducing player fatigue.',
      },
      {
        q: 'Can I rent non-marking badminton shoes at the venue?',
        a: 'Yes, most wooden court venues in Mangalore offer sanitized non-marking shoes for rent at the reception for ₹30 to ₹50 per hour.',
      },
    ],
  },
];

export function getCuratedCollection(slug: string): CuratedCollection | null {
  return CURATED_COLLECTIONS.find((c) => c.slug === slug) ?? null;
}
