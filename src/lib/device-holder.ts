import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

const DEVICE_COOKIE = 'oyun_device';

/*
 * Slot holds belong to a browser, identified by a random httpOnly cookie.
 * Only its hash is stored, so the database never holds a usable token.
 * `create` sets the cookie when missing (server actions only; pages can't set cookies).
 */
export async function deviceHolder(create: boolean): Promise<string | null> {
  const jar = await cookies();
  let token = jar.get(DEVICE_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) {
    if (!create) return null;
    token = randomBytes(24).toString('base64url');
    jar.set(DEVICE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return createHash('sha256').update(token).digest('base64url');
}
