import { refreshAll } from '@/lib/action-utils';
import { deviceHolder } from '@/lib/device-holder';
import { sharedRateLimit } from '@/lib/shared-rate-limit';
import { mutate } from '@/lib/store';
import { isV2SlotsActive, v2ReleaseHolds } from '@/lib/v2-slots';
import { clientIpFrom } from '@/lib/client-ip';
import { isSameOrigin } from '@/lib/same-origin';

// Called with navigator.sendBeacon when a player leaves checkout (closes the tab, goes back),
// so their held slots open up for everyone straight away instead of after the 8-minute timeout.
export async function POST(req: Request) {
  // Reject requests with no Origin (direct script/curl calls) or from a different host.
  // navigator.sendBeacon always sends Origin, so legitimate releases are never rejected.
  if (!isSameOrigin(req.headers)) return new Response(null, { status: 403 });

  // Rate-limit to prevent this endpoint from being used to loop-release other devices' holds.
  const ip = clientIpFrom(req.headers);
  if (!(await sharedRateLimit(`holds-release:${ip}`, 60, 60_000))) return new Response(null, { status: 429 });

  const holder = await deviceHolder(false);
  if (holder) {
    // With v2 slots the holds live in the oyun schema and the store has nothing to write
    if (isV2SlotsActive()) {
      await v2ReleaseHolds(holder);
    } else {
      try {
        await mutate((db) => {
          db.holds = db.holds.filter((h) => h.holder !== holder);
        });
        refreshAll();
      } catch (err) {
        console.warn('[holds/release] release failed:', err);
      }
    }
  }
  return new Response(null, { status: 204 });
}
