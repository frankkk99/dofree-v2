import { createClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client used by client components.
 *
 * Important: this function is typed as non-null so production builds do not
 * fail in every client page with "supabase is possibly null". When the public
 * Supabase env vars are missing, we still return null at runtime through a
 * never cast so existing UI guards like `if (!supabase)` continue to show the
 * friendly setup message instead of crashing the page.
 */
export function createSupabaseBrowserClient(): ReturnType<typeof createClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null as never;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
