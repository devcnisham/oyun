import type { Instrumentation } from 'next';

// Process-level crash prevention and monitoring registration
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on('unhandledRejection', (reason) => {
      console.error('[server] Unhandled Promise Rejection:', reason);
      import('./lib/monitoring').then(({ reportError }) => {
        const err = reason instanceof Error ? reason : new Error(String(reason));
        reportError({
          source: 'server',
          message: `Unhandled Rejection: ${err.message}`,
          stack: err.stack,
          path: 'unhandledRejection',
        }).catch(() => {});
      }).catch(() => {});
    });

    process.on('uncaughtException', (err) => {
      console.error('[server] Uncaught Exception:', err);
      import('./lib/monitoring').then(({ reportError }) => {
        reportError({
          source: 'server',
          message: `Uncaught Exception: ${err.message}`,
          stack: err.stack,
          path: 'uncaughtException',
        }).catch(() => {});
      }).catch(() => {});
    });
  }
}

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
