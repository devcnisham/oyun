import type { Instrumentation } from 'next';

// Server errors (pages, server actions, route handlers, proxy) -> monitoring
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportError } = await import('./lib/monitoring');
  const error = err as Error & { digest?: string };
  await reportError({
    source: 'server',
    message: error?.message ?? String(err),
    digest: error?.digest,
    stack: error?.stack,
    path: request.path.split('?')[0],
    extra: { method: request.method, routerKind: context.routerKind, routePath: context.routePath, routeType: context.routeType },
  });
};
