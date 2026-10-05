'use server';

import { createHash } from 'node:crypto';
import { redirect } from 'next/navigation';
import { verifyPassword } from './password';
import { ROLES, createSession, deleteSession, safeEqual, type Role } from './session';
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
function partnerSubject(email: string, password: string) {
  const db = getDb();
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

export async function login(role: Role, _prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!ROLES.includes(role)) return { error: 'Invalid login.' };
  if (!process.env.SESSION_SECRET) return { error: 'Login is not configured on the server.' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const subject = role === 'admin' ? adminSubject(email, password) : partnerSubject(email, password);
  if (!subject) return { error: 'Invalid email or password.' };

  await createSession(role, subject);
  redirect(`/${role}`);
}

// One-click demo access; only works while DEMO_LOGIN=true
export async function demoLogin(role: Role): Promise<LoginState> {
  if (!ROLES.includes(role)) return { error: 'Invalid login.' };
  if (process.env.DEMO_LOGIN !== 'true' || !process.env.SESSION_SECRET) {
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
