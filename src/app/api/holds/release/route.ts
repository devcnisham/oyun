import { deviceHolder } from '@/lib/device-holder';
import { sharedRateLimit } from '@/lib/shared-rate-limit';
import { mutate } from '@/lib/store';
import { isV2SlotsActive, v2ReleaseHolds } from '@/lib/v2-slots';

// A malformed or "null" Origin must be refused, not crash the route
function originHost(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

// Called with navigator.sendBeacon when a player leaves checkout (closes the tab, goes back),
// so their held slots open up for everyone straight away instead of after the 8-minute timeout.
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');

  // Reject requests with no Origin (direct script/curl calls) or from a different host.
  // navigator.sendBeacon always sends Origin, so legitimate releases are never rejected.
  if (!origin || !host || originHost(origin) !== host) return new Response(null, { status: 403 });

  // Rate-limit to prevent this endpoint from being used to loop-release other devices' holds.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await sharedRateLimit(`holds-release:${ip}`, 60, 60_000))) return new Response(null, { status: 429 });

  const holder = await deviceHolder(false);
  if (holder) {
    if (isV2SlotsActive()) {
      await v2ReleaseHolds(holder);
    }
    try {
      await mutate((db) => {
        db.holds = db.holds.filter((h) => h.holder !== holder);
      });
    } catch (err) {
      console.warn('[holds/release] release failed:', err);
    }
  }
  return new Response(null, { status: 204 });
}
