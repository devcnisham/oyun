'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createLoginThrottle } from './login-throttle';
import { verifyPassword } from './password';
import { ROLES, createSession, deleteSession, safeEqual, type Role } from './session';
import { sessionSecret } from './env';
import { getDb } from './store';

export type LoginState = { error?: string } | undefined;

// Hash both sides so the comparison is constant-time regardless of input length
function matches(input: string, expected: string) {
  const hash = (s: string) => createHash('sha256').update(s).digest('hex');
  return safeEqual(hash(input), hash(expected));
}

function adminSubject(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return null;
  const emailOk = matches(email, expectedEmail.trim().toLowerCase());
  const passwordOk = matches(password, expectedPassword);
  return emailOk && passwordOk ? 'admin' : null;
}

// Turf owners and their staff are stored in the database
async function partnerSubject(email: string, password: string) {
  const db = await getDb();
  // The OYUN operations account (manages the launch turfs) signs in with PARTNER_EMAIL / PARTNER_PASSWORD,
  // read at login time so changing them in the hosting settings takes effect straight away
  const opsEmail = process.env.PARTNER_EMAIL?.trim().toLowerCase();
  const opsPassword = process.env.PARTNER_PASSWORD;
  const ops = db.partners.find((p) => p.id === 'partner_oyun');
  if (ops && opsEmail && opsPassword && matches(email, opsEmail)) {
    return ops.status === 'active' && matches(password, opsPassword) ? `p:${ops.id}` : null;
  }
  const partner = db.partners.find((p) => p.email === email);
  if (partner) {
    return partner.status === 'active' && verifyPassword(password, partner.passwordHash) ? `p:${partner.id}` : null;
  }
  const staff = db.staff.find((s) => s.email === email);
  if (staff) {
    const owner = db.partners.find((p) => p.id === staff.partnerId);
    return owner?.status === 'active' && verifyPassword(password, staff.passwordHash) ? `s:${staff.id}` : null;
  }
  return null;
}

// Slow down password guessing: see login-throttle.ts for the rules
const throttle = createLoginThrottle();

async function clientIp() {
  return (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function login(role: Role, _prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!ROLES.includes(role)) return { error: 'Invalid login.' };
  if (!sessionSecret()) return { error: 'Login is not configured on the server (set SESSION_SECRET).' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const password = String(formData.get('password') ?? '').slice(0, 200);
  if (!email || !password) return { error: 'Enter your email and password.' };

  const ip = await clientIp();
  if (throttle.isLocked(role, email, ip)) return { error: 'Too many failed attempts. Try again in 15 minutes.' };

  const subject = role === 'admin' ? adminSubject(email, password) : await partnerSubject(email, password);
  if (!subject) {
    throttle.recordFailure(role, email, ip);
    return { error: 'Invalid email or password.' };
  }
  throttle.recordSuccess(role, email, ip);

  await createSession(role, subject);
  redirect(`/${role}`);
}


export async function logout(role: Role) {
  if (!ROLES.includes(role)) return;
  await deleteSession(role);
  redirect(`/${role}/login`);
}
