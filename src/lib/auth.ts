/**
 * Who is signed in. Every page, server action and private route handler
 * checks this; proxy.ts only redirects early and isn't relied on alone.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { authDisabled, supabaseConfig } from "./supabase/config";
import { createSupabase } from "./supabase/server";

export type SessionUser = { id: string; email: string; name: string };

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (authDisabled()) return { id: "local", email: "", name: "" };
  if (!supabaseConfig()) return null; // production without Supabase: nobody gets in
  const supabase = await createSupabase();
  // Verifies the JWT, refreshing it if needed; never trust getSession() alone
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const name = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";
  return { id: claims.sub, email: claims.email ?? "", name };
});

/** For pages and server actions: sends anyone signed out to the login page */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
