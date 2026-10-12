import { describe, expect, test } from 'vitest';
import { createLoginThrottle } from './login-throttle';

const MIN = 60_000;
const setup = () => {
  let t = 1_000_000;
  const throttle = createLoginThrottle({ now: () => t });
  return { throttle, advance: (ms: number) => (t += ms) };
};
const fail = (th: ReturnType<typeof createLoginThrottle>, n: number, role = 'admin', email = 'a@x.in', ip = '1.1.1.1') => {
  for (let i = 0; i < n; i++) th.recordFailure(role, email, ip);
};

describe('login throttle', () => {
  test('five wrong passwords lock that email for that IP, four do not', () => {
    const { throttle } = setup();
    fail(throttle, 4);
    expect(throttle.isLocked('admin', 'a@x.in', '1.1.1.1')).toBe(false);
    fail(throttle, 1);
    expect(throttle.isLocked('admin', 'a@x.in', '1.1.1.1')).toBe(true);
  });

  test('an attacker cannot lock the real admin out from another IP', () => {
    const { throttle } = setup();
    fail(throttle, 50, 'admin', 'a@x.in', '6.6.6.6'); // the attacker hammers the admin email
    expect(throttle.isLocked('admin', 'a@x.in', '6.6.6.6')).toBe(true);
    expect(throttle.isLocked('admin', 'a@x.in', '2.2.2.2')).toBe(false); // the admin on their own IP still gets in
  });

  test('spraying many emails from one IP locks that IP once the per-IP cap is reached', () => {
    const { throttle } = setup();
    for (let i = 0; i < 19; i++) throttle.recordFailure('admin', `user${i}@x.in`, '6.6.6.6');
    expect(throttle.isLocked('admin', 'fresh@x.in', '6.6.6.6')).toBe(false);
    throttle.recordFailure('admin', 'user19@x.in', '6.6.6.6');
    expect(throttle.isLocked('admin', 'fresh@x.in', '6.6.6.6')).toBe(true);
    expect(throttle.isLocked('admin', 'fresh@x.in', '2.2.2.2')).toBe(false);
  });

  test('the admin and partner logins are counted separately', () => {
    const { throttle } = setup();
    fail(throttle, 5, 'admin');
    expect(throttle.isLocked('partner', 'a@x.in', '1.1.1.1')).toBe(false);
  });

  test('a lock ends 15 minutes after the last failure', () => {
    const { throttle, advance } = setup();
    fail(throttle, 5);
    advance(14 * MIN);
    expect(throttle.isLocked('admin', 'a@x.in', '1.1.1.1')).toBe(true);
    advance(2 * MIN);
    expect(throttle.isLocked('admin', 'a@x.in', '1.1.1.1')).toBe(false);
  });

  test('a correct password clears that email on that IP', () => {
    const { throttle } = setup();
    fail(throttle, 4);
    throttle.recordSuccess('admin', 'a@x.in', '1.1.1.1');
    fail(throttle, 4);
    expect(throttle.isLocked('admin', 'a@x.in', '1.1.1.1')).toBe(false);
  });

  test('memory stays bounded', () => {
    const t = createLoginThrottle({ maxEntries: 50 });
    for (let i = 0; i < 500; i++) t.recordFailure('admin', `u${i}@x.in`, `10.0.0.${i % 250}`);
    expect(t.isLocked('admin', 'u499@x.in', '10.0.0.249')).toBe(false); // still works after eviction
  });
});
