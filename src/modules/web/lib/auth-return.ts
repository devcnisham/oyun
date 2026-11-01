/** Keep sign-in returns on the current site, with the correct local booking entry. */
export function authReturnPath(target: string | undefined, host: string): string {
  if (target?.startsWith('/') && !target.startsWith('//') && !/[\\\u0000-\u001f]/.test(target)) return target;
  const hostname = host.toLowerCase().replace(/:\d+$/, '');
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname) ? '/booking' : '/';
}
