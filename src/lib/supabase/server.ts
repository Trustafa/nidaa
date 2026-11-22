import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig } from "./config";

/** Supabase client bound to this request's auth cookies */
export async function createSupabase() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase isn't configured: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components can't set cookies; proxy.ts refreshes the session instead
        }
      },
    },
  });
}
