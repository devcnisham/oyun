'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sharedLoginThrottle } from './shared-rate-limit';
import { burnPasswordCheck, verifyPassword } from './password';
import { ROLES, createSession, deleteSession, safeEqual, type Role } from './session';
import { sessionSecret } from './env';
import { getDb } from './store';

export type LoginState = { error?: string } | undefined;

// Hash both sides so the comparison is constant-time regardless of input length
function matches(input: string, expected: string) {
  const hash = (s: string) => createHash('sha256').update(s).digest('hex');
  return safeEqual(hash(input), hash(expected));
}

import { verifyTotp } from './totp';
import { clientIpFrom } from '@/lib/client-ip';

export interface AdminUser {
  id: string;
  email: string;
  password?: string;
  passwordHash?: string;
  mfaSecret?: string;
}

function getAdminUsers(): AdminUser[] {
  if (process.env.ADMIN_USERS) {
    try {
      const parsed = JSON.parse(process.env.ADMIN_USERS);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback to env variables
    }
  }
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const mfaSecret = process.env.ADMIN_MFA_SECRET;
  if (!email || !password) return [];
  return [{ id: 'admin', email, password, mfaSecret }];
}

function adminSubject(email: string, password: string, totpCode?: string) {
  const users = getAdminUsers();
  for (const user of users) {
    if (!matches(email, user.email.trim().toLowerCase())) continue;
    let pwdOk = false;
    if (user.passwordHash) {
      pwdOk = verifyPassword(password, user.passwordHash);
    } else if (user.password) {
      pwdOk = matches(password, user.password);
    }
    if (!pwdOk) continue;
    if (user.mfaSecret) {
      if (!totpCode || !verifyTotp(totpCode, user.mfaSecret)) return null;
    }
    return user.id === 'admin' ? 'admin' : `admin:${user.id}`;
  }
  return null;
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
    // Pay one scrypt on this branch too, so the ops email does not answer faster than a partner email
    burnPasswordCheck(password);
    return ops.status === 'active' && matches(password, opsPassword) ? `p:${ops.id}` : null;
  }
  const partner = db.partners.find((p) => p.email === email);
  if (partner) {
    // Always run the hash check: an inactive account must not answer faster than an active one
    const ok = verifyPassword(password, partner.passwordHash);
    return partner.status === 'active' && ok ? `p:${partner.id}` : null;
  }
  const staff = db.staff.find((s) => s.email === email);
  if (staff) {
    const owner = db.partners.find((p) => p.id === staff.partnerId);
    const ok = verifyPassword(password, staff.passwordHash);
    return owner?.status === 'active' && ok ? `s:${staff.id}` : null;
  }
  burnPasswordCheck(password);
  return null;
}

// Slow down password guessing: see login-throttle.ts for the rules
const throttle = sharedLoginThrottle;

async function clientIp() {
  return clientIpFrom(await headers());
}

export async function login(role: Role, _prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!ROLES.includes(role)) return { error: 'Invalid login.' };
  if (!sessionSecret()) return { error: 'Login is not configured on the server (set SESSION_SECRET).' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const password = String(formData.get('password') ?? '').slice(0, 200);
  if (!email || !password) return { error: 'Enter your email and password.' };

  const ip = await clientIp();
  if (await throttle.isLocked(role, email, ip)) return { error: 'Too many failed attempts. Try again in 15 minutes.' };

  const totpCode = String(formData.get('totpCode') ?? formData.get('mfaCode') ?? '').trim();
  const subject = role === 'admin' ? adminSubject(email, password, totpCode) : await partnerSubject(email, password);
  if (!subject) {
    await throttle.recordFailure(role, email, ip);
    return { error: 'Invalid email, password, or MFA code.' };
  }
  await throttle.recordSuccess(role, email, ip);

  await createSession(role, subject);
  redirect(`/${role}`);
}


export async function logout(role: Role) {
  if (!ROLES.includes(role)) return;
  await deleteSession(role);
  redirect(`/${role}/login`);
}
