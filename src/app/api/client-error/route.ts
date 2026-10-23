import { reportError } from '@/modules/shared/backend/monitoring';
import { sharedRateLimit } from '@/modules/shared/backend/shared-rate-limit';
import { clientIpFrom } from '@/modules/shared/backend/client-ip';

// Receives browser error reports from instrumentation-client.ts
export async function POST(req: Request) {
  const ip = clientIpFrom(req.headers);
  if (!(await sharedRateLimit(`client-error:${ip}`, 20, 60_000))) return new Response(null, { status: 429 });

  const raw = await req.text();
  if (raw.length > 5000) return new Response(null, { status: 413 });
  let data: { message?: unknown; stack?: unknown; path?: unknown };
  try {
    data = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof data.message !== 'string') return new Response(null, { status: 400 });

  await reportError({
    source: 'client',
    message: data.message,
    stack: typeof data.stack === 'string' ? data.stack : undefined,
    path: typeof data.path === 'string' ? data.path.slice(0, 200) : undefined,
  });
  return new Response(null, { status: 204 });
}
