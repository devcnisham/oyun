/*
 * Error monitoring. Every error is logged as one JSON line (visible in Vercel → Logs).
 * Set ERROR_WEBHOOK_URL (Slack or Discord incoming webhook) to also get a message per error.
 * Never include cookies, headers or form data: reports may contain personal data otherwise.
 */

export interface ErrorReport {
  source: 'server' | 'client';
  message: string;
  digest?: string;
  path?: string;
  stack?: string;
  extra?: Record<string, string | number | undefined>;
}

const recent = new Map<string, number>();

export async function reportError(report: ErrorReport) {
  const entry = { level: 'error', time: new Date().toISOString(), ...report, message: report.message.slice(0, 500), stack: report.stack?.slice(0, 2000) };
  console.error(JSON.stringify(entry));

  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (!webhook) return;

  // Only send to an https:// endpoint to prevent SSRF via a misconfigured env var.
  try {
    const webhookUrl = new URL(webhook);
    if (webhookUrl.protocol !== 'https:') return;
  } catch {
    return;
  }

  // One notification per distinct error per 10 minutes, so a broken page doesn't flood the channel
  const key = `${report.source}:${report.message}:${report.path}`;
  const last = recent.get(key) ?? 0;
  if (Date.now() - last < 10 * 60_000) return;
  recent.set(key, Date.now());
  if (recent.size > 500) recent.delete(recent.keys().next().value!);

  // Client reports are unauthenticated, so the text must not be able to ping a channel (@everyone, <!channel>, <@user>)
  const safe = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/@/g, '@\u200b');
  const text = ` OYUN ${report.source} error${report.path ? ` on ${safe(report.path)}` : ''}: ${safe(entry.message)}${report.digest ? ` (digest ${safe(report.digest)})` : ''}`;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text, allowed_mentions: { parse: [] } }), // Slack uses text, Discord uses content
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // monitoring must never break the request
  }
}
