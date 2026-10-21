import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from './site';
import type { PublicTurf } from './types';

// schema.org JSON-LD builders

export function organizationSchema(supportEmail: string, supportPhone: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/oyun-icon-512.png'),
    description: SITE_DESCRIPTION,
    email: supportEmail,
    telephone: supportPhone || undefined,
    areaServed: { '@type': 'City', name: 'Mangalore' },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/arenas?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function turfSchema(turf: PublicTurf) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': absoluteUrl(`/arenas/${turf.id}#venue`),
    name: turf.name,
    description: turf.description,
    url: absoluteUrl(`/arenas/${turf.id}`),
    image: turf.images.map((src) => absoluteUrl(src)),
    telephone: turf.phone || undefined,
    priceRange: `₹${turf.pricePerHour}+ per hour`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: turf.location,
      addressLocality: turf.city,
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS, opens: turf.openTime, closes: turf.closeTime === '00:00' ? '23:59' : turf.closeTime }],
    amenityFeature: turf.amenities.map((a) => ({ '@type': 'LocationFeatureSpecification', name: a, value: true })),
    ...(turf.reviewCount > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: turf.rating, reviewCount: turf.reviewCount, bestRating: 5 } }
      : {}),
    makesOffer: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: turf.pricePerHour,
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/arenas/${turf.id}`),
      description: `${turf.size} turf booking, per hour`,
    },
  };
}

export function itemListSchema(turfs: PublicTurf[], name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: turfs.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/arenas/${t.id}`), name: t.name })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function articleSchema(article: {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: absoluteUrl(article.path),
    image: article.image || undefined,
    datePublished: article.datePublished,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: absoluteUrl('/oyun-icon-512.png'),
    },
  };
}

