"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase/config";
import { createSupabase } from "@/lib/supabase/server";
import type { FormState } from "./actions";

/** Only same-site paths, so ?next= can't bounce people to another website */
function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const errors: Record<string, string> = {};
  if (!email) errors.email = "Enter your email.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length) return { ok: false, errors };
  if (!supabaseConfig()) return { ok: false, message: "Sign-in isn't set up on this server yet." };

  const supabase = await createSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "That email and password don't match. Check for typos, or ask whoever set up Nidaa to reset your password."
        : error.code === "email_not_confirmed"
          ? "This account hasn't been confirmed yet. Open the link in your invitation email first."
          : error.status === 429
            ? "Too many attempts. Wait a few minutes and try again."
            : "Couldn't sign in right now. Try again in a moment.";
    return { ok: false, message };
  }
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  if (supabaseConfig()) {
    const supabase = await createSupabase();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const errors: Record<string, string> = {};
  if (password.length < 10) errors.password = "Use at least 10 characters.";
  else if (password !== confirm) errors.confirm = "The two passwords don't match.";
  if (Object.keys(errors).length) return { ok: false, errors };
  if (!supabaseConfig()) return { ok: false, message: "Sign-in isn't set up on this server." };

  const supabase = await createSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const message =
      error.code === "same_password"
        ? "That's already your password. Choose a new one."
        : error.code === "weak_password"
          ? "That password is too easy to guess. Try a longer one."
          : error.code === "reauthentication_needed"
            ? "For safety, sign out and back in, then change your password straight away."
            : `Couldn't change your password: ${error.message}`;
    return { ok: false, message };
  }
  return { ok: true, message: "Password changed." };
}
