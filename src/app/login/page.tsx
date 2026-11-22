import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { LoginForm } from "@/components/login-form";
import { authDisabled } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in · Nidaa",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-cover px-4 py-12">
      <div className="mb-8">
        <Wordmark />
      </div>
      <main className="w-full max-w-sm rounded-lg bg-bg px-6 py-8 shadow-[0_1px_0_var(--line),0_12px_40px_-12px_oklch(0.2_0.05_260/0.45)] sm:px-8">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink">Sign in</h1>
        {authDisabled() ? (
          <p className="mt-3 text-[0.9375rem] leading-6 text-ink-muted">
            Sign-in is off on this computer because Supabase isn&apos;t set up, so you can practise freely.{" "}
            <Link href="/" className="font-semibold text-brand-600 underline">
              Open the dashboard
            </Link>
          </p>
        ) : (
          <>
            <p className="mt-1 text-[0.9375rem] text-ink-muted">To your guest book.</p>
            <LoginForm next={next ?? ""} />
          </>
        )}
      </main>
      <Link href="/privacy" className="mt-6 text-sm text-cover-ink-muted hover:text-cover-ink">
        Privacy policy
      </Link>
    </div>
  );
}
