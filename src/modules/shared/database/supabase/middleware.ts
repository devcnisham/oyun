import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/*
 * Refreshes the Supabase Auth session cookie (if any) and returns the response
 * to continue with. Called from src/proxy.ts on every page request.
 *
 * Why this stays: players sign in with Clerk and staff use their own signed cookie, so no
 * Supabase Auth cookie is normally present and this returns on the cookie check below.
 * It is kept only so a Supabase Auth session (for example an owner testing RLS with a
 * Supabase user) keeps refreshing. If Supabase Auth is never adopted, delete this file
 * and the call in src/proxy.ts.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  if (!supabaseUrl || !supabaseKey) return supabaseResponse;
  // No Supabase Auth cookie: nothing to refresh, skip the work
  if (!request.cookies.getAll().some((c) => c.name.startsWith('sb-'))) return supabaseResponse;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // Validates the token and refreshes it when expired; do not remove
  await supabase.auth.getClaims();

  return supabaseResponse;
}
