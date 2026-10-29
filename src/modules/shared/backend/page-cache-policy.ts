// Pages prerendered at build (the ○ rows of `next build`). A per-request nonce on the request makes Next render them again
// for every visitor (private, no-store), so these skip it and let the CDN serve the prebuilt HTML. They hold no per-player
// data and no forms with user input, so the build-time policy (inline scripts allowed, hosts still allow-listed) is used.
const PRERENDERED_PAGES = new Set(['/', '/m', '/about', '/arenas', '/faq', '/help', '/list-turf', '/matches', '/privacy', '/saved', '/settings', '/terms', '/tournaments', '/areas', '/countdown', '/landing', '/sports', '/events', '/blog', '/news', '/guides', '/offers', '/membership', '/kn', '/hi']);
// Also cached by the CDN: the turf, sport and area pages (one segment under these folders)
const PRERENDERED_FOLDERS = /^\/(arenas|sports|turfs|prices|guides|curated)\/[^/]+$/;
const SPORT_AREA_PAGE = /^\/sports\/[^/]+\/[^/]+$/;
export const isPrerendered = (pathname: string) => PRERENDERED_PAGES.has(pathname) || PRERENDERED_FOLDERS.test(pathname) || SPORT_AREA_PAGE.test(pathname);

