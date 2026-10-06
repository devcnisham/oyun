// Browser errors -> /api/client-error (at most 5 reports per page load)
let sent = 0;

function send(message: string, stack?: string) {
  if (sent >= 5 || !message) return;
  sent++;
  try {
    const body = JSON.stringify({ message: message.slice(0, 500), stack: stack?.slice(0, 2000), path: location.pathname });
    if (!navigator.sendBeacon?.('/api/client-error', new Blob([body], { type: 'application/json' }))) {
      fetch('/api/client-error', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {}
}

window.addEventListener('error', (event) => {
  // Ignore failed resource loads and cross-origin "Script error."
  if (!event.error && (!event.message || event.message === 'Script error.')) return;
  send(event.message || String(event.error), event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as { message?: string; stack?: string } | undefined;
  send(reason?.message ?? String(event.reason), reason?.stack);
});
