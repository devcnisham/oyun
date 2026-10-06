'use server';

import { createHash } from 'node:crypto';
import { redirect } from 'next/navigation';
import { verifyPassword } from './password';
import { ROLES, createSession, deleteSession, safeEqual, type Role } from './session';
import { demoLoginEnabled, sessionSecret } from './env';
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

// Turf owners and their staff are stored in the demo database
async function partnerSubject(email: string, password: string) {
  const db = await getDb();
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

// Slow down password guessing: lock an account for a while after repeated failures.
// In-memory, so per server instance; move to a shared store along with the database.
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; until: number }>();

function lockedOut(key: string) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (entry.until && entry.until < Date.now()) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(key: string) {
  const entry = failures.get(key) ?? { count: 0, until: 0 };
  entry.count += 1;
  entry.until = Date.now() + LOCKOUT_MS;
  failures.set(key, entry);
  if (failures.size > 10_000) failures.delete(failures.keys().next().value!);
}

export async function login(role: Role, _prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!ROLES.includes(role)) return { error: 'Invalid login.' };
  if (!sessionSecret()) return { error: 'Login is not configured on the server (set SESSION_SECRET).' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const password = String(formData.get('password') ?? '').slice(0, 200);
  if (!email || !password) return { error: 'Enter your email and password.' };

  const key = `${role}:${email}`;
  if (lockedOut(key)) return { error: 'Too many failed attempts. Try again in 15 minutes.' };

  const subject = role === 'admin' ? adminSubject(email, password) : await partnerSubject(email, password);
  if (!subject) {
    recordFailure(key);
    return { error: 'Invalid email or password.' };
  }
  failures.delete(key);

  await createSession(role, subject);
  redirect(`/${role}`);
}

// One-click demo access; only works while DEMO_LOGIN=true
export async function demoLogin(role: Role): Promise<LoginState> {
  if (!ROLES.includes(role)) return { error: 'Invalid login.' };
  if (!demoLoginEnabled() || !sessionSecret()) {
    return { error: 'Demo login is disabled.' };
  }

  await createSession(role, role === 'admin' ? 'admin' : 'p:partner_demo');
  redirect(`/${role}`);
}

export async function logout(role: Role) {
  if (!ROLES.includes(role)) return;
  await deleteSession(role);
  redirect(`/${role}/login`);
}
