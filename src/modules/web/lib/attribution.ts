// First-visit source of a booking ("where did this player come from"). Captured in the browser on the first page view
// (UTM tags, search or social referrer, or direct), kept in a first-party cookie and saved on the booking.
// Only campaign labels are kept: no names, no phone numbers, no full referrer URLs.

export const ATTRIBUTION_COOKIE = 'oyun_src';
export const ATTRIBUTION_DAYS = 30;

export interface Attribution {
  source: string; // utm_source, the referring site's host, or "direct"
  medium: string; // utm_medium, or "organic" / "referral" / "none"
  campaign?: string;
  landing: string; // first page path, without query
}

const clean = (v: string | null | undefined, max = 60) => (v ?? '').replace(/[^\w .:@/+-]/g, '').trim().slice(0, max);

const SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|yandex|baidu)\./i;

// params: the page URL's query; referrer: document.referrer; ownHost: location.hostname
export function parseAttribution(landingPath: string, params: URLSearchParams, referrer: string, ownHost: string): Attribution {
  const utmSource = clean(params.get('utm_source'));
  const landing = clean(landingPath.split('?')[0], 120) || '/';
  if (utmSource) {
    return {
      source: utmSource.toLowerCase(),
      medium: clean(params.get('utm_medium')).toLowerCase() || 'none',
      ...(clean(params.get('utm_campaign')) ? { campaign: clean(params.get('utm_campaign')).toLowerCase() } : {}),
      landing,
    };
  }
  let host = '';
  try {
    host = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : '';
  } catch {}
  const root = (h: string) => h.split('.').slice(-3).join('.');
  if (!host || root(host) === root(ownHost.replace(/^www\./, ''))) return { source: 'direct', medium: 'none', landing };
  return { source: clean(host).toLowerCase(), medium: SEARCH.test(host) ? 'organic' : 'referral', landing };
}

export const encodeAttribution = (a: Attribution) => encodeURIComponent(JSON.stringify(a));

// Read from a cookie value on the server; anything malformed is ignored
export function decodeAttribution(raw: string | undefined): Attribution | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw)) as Partial<Attribution>;
    if (typeof v.source !== 'string' || typeof v.medium !== 'string' || typeof v.landing !== 'string') return null;
    return {
      source: clean(v.source),
      medium: clean(v.medium),
      ...(typeof v.campaign === 'string' && clean(v.campaign) ? { campaign: clean(v.campaign) } : {}),
      landing: clean(v.landing, 120) || '/',
    };
  } catch {
    return null;
  }
}
