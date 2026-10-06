import { deviceHolder } from '@/lib/device-holder';
import { mutate } from '@/lib/store';

// Called with navigator.sendBeacon when a player leaves checkout (closes the tab, goes back),
// so their held slots open up for everyone straight away instead of after the 8-minute timeout.
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return new Response(null, { status: 403 });

  const holder = await deviceHolder(false);
  if (holder) {
    await mutate((db) => {
      db.holds = db.holds.filter((h) => h.holder !== holder);
    });
  }
  return new Response(null, { status: 204 });
}
