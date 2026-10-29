// A nonce generated after prerendering cannot match scripts baked into static HTML.
// Keep the proxy's cache/CSP policy aligned with Next's actual build output.
import { readFileSync } from 'node:fs';
import { isPrerendered } from '../src/modules/shared/backend/page-cache-policy.ts';

const { routes } = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'));
const assets = new Set(['/opengraph-image', '/twitter-image']);
const missing = Object.keys(routes).filter(path => !path.startsWith('/_') && !path.includes('.') && !assets.has(path) && !isPrerendered(path));
if (missing.length) throw new Error(`Prebuilt pages would receive an incompatible request nonce: ${missing.join(', ')}. Update page-cache-policy or render account pages dynamically.`);
console.log('Prerendered pages match the proxy CSP policy.');
