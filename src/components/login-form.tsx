"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/auth-actions";
import type { FormState } from "@/app/actions";
import { Field, Spinner, btnPrimary, inputBase } from "./ui";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, {});
  const err = state.errors ?? {};
  // Controlled, so a failed attempt doesn't wipe what they typed
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email" error={err.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
          aria-invalid={Boolean(err.email)}
          className={inputBase}
        />
      </Field>
      <Field label="Password" htmlFor="password" error={err.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(err.password)}
          className={inputBase}
        />
      </Field>
      {state.message && (
        <p role="alert" className="text-sm leading-5 text-declined-ink">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-1 w-full ${btnPrimary}`}>
        {pending && <Spinner />}
        Sign in
      </button>
    </form>
  );
}
