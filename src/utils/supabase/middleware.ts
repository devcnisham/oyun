import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/*
 * Refreshes the Supabase Auth session cookie (if any) and returns the response
 * to continue with. Called from src/proxy.ts on every page request.
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
