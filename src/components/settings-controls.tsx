"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { sendTestMessageAction, updateOrgAction, type FormState } from "@/app/actions";
import type { Organization } from "@/lib/types";
import { useToast } from "./toast";
import { Field, Spinner, btnPrimary, btnSecondary, btnSecondarySm, inputBase } from "./ui";

export function OrgForm({ org }: { org: Organization }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateOrgAction, {});
  const toast = useToast();
  const err = state.errors ?? {};
  useEffect(() => {
    if (state.ok) toast("Organization details saved.");
  }, [state, toast]);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="organizerName" error={err.organizerName}>
          <input id="organizerName" name="organizerName" defaultValue={org.organizerName} aria-invalid={Boolean(err.organizerName)} className={inputBase} />
        </Field>
        <Field label="Organization" htmlFor="org-name" error={err.name}>
          <input id="org-name" name="name" defaultValue={org.name} aria-invalid={Boolean(err.name)} className={inputBase} />
        </Field>
      </div>
      <div>
        <button type="submit" disabled={pending} className={btnSecondary}>
          {pending && <Spinner />}
          Save
        </button>
      </div>
    </form>
  );
}

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border border-line-strong bg-surface px-2.5 py-2 font-mono text-[0.8125rem]">{value}</code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className={btnSecondarySm}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/** Runs a server action that reports back with a message, and toasts the result */
export function ActionButton({
  action,
  children,
  primary = false,
}: {
  action: () => Promise<{ ok: boolean; message: string }>;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await action();
          toast(r.message, r.ok ? "success" : "error");
        })
      }
      className={primary ? btnPrimary : btnSecondarySm}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}

export function TestMessageForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(sendTestMessageAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-2" noValidate>
      <label htmlFor="test-phone" className="font-bold">
        Send yourself a test message
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="test-phone"
          name="phone"
          type="tel"
          placeholder="+971 50 123 4567"
          disabled={disabled}
          aria-invalid={Boolean(state.errors?.phone)}
          className={`tnum sm:max-w-64 ${inputBase}`}
        />
        <button type="submit" disabled={disabled || pending} className={btnSecondary}>
          {pending && <Spinner />}
          Send hello_world
        </button>
      </div>
      <p className={`text-sm ${state.ok ? "text-attending-ink" : state.message || state.errors ? "text-declined-ink" : "text-ink-muted"}`} role="status">
        {state.errors?.phone ??
          state.message ??
          "Uses Meta's pre-approved hello_world template. On a test number, the recipient must be on its allowed list."}
      </p>
    </form>
  );
}
