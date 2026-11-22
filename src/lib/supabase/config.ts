/**
 * Supabase Auth settings. Read at runtime (not NEXT_PUBLIC_), since only the
 * server talks to Supabase: the login form posts to a server action.
 */
export function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

/** Local practice without Supabase: no login screen. Never allowed in production. */
export function authDisabled() {
  return !supabaseConfig() && process.env.NODE_ENV !== "production";
}
