import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { sessionSecret } from './env';

export type Role = 'admin' | 'partner';

export const ROLES: Role[] = ['admin', 'partner'];

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export function sessionCookieName(role: Role) {
  return `sa_${role}_session`;
}

function sign(data: string, secret: string) {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/*
 * Token format: <role>.<subject>.<expiresAt>.<signature>
 * subject: "admin" for admins, "p:<partnerId>" for turf owners, "s:<staffId>" for staff.
 * Returns the subject when the token is valid, otherwise null.
 */
export function verifySessionToken(token: string | undefined, role: Role): string | null {
  const secret = sessionSecret();
  if (!token || !secret) return null;

  const [tokenRole, subject, expiresAt, signature] = token.split('.');
  if (tokenRole !== role || !subject || !expiresAt || !signature) return null;
  if (Number(expiresAt) < Date.now() / 1000) return null;

  return safeEqual(signature, sign(`${tokenRole}.${subject}.${expiresAt}`, secret)) ? subject : null;
}

export async function createSession(role: Role, subject: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error('SESSION_SECRET is not set');
  if (subject.includes('.')) throw new Error('Invalid session subject');

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${role}.${subject}.${expiresAt}`;

  (await cookies()).set(sessionCookieName(role), `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteSession(role: Role) {
  (await cookies()).delete(sessionCookieName(role));
}

/*
 * Local development only: `next dev` on your own machine skips the admin and partner login so you can
 * walk straight into the dashboards. It is never active on a deployed site (Vercel, `next start`, any
 * production build), where the real login always applies.
 */
export function devLoginSkipped() {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
}

export async function getSessionSubject(role: Role) {
  if (devLoginSkipped()) return role === 'admin' ? 'admin' : 'p:partner_oyun';

  const token = (await cookies()).get(sessionCookieName(role))?.value;
  return verifySessionToken(token, role);
}

export async function hasSession(role: Role) {
  return (await getSessionSubject(role)) !== null;
}
