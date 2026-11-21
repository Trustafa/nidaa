import Link from "next/link";
import { connection } from "next/server";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { Wordmark } from "@/components/wordmark";
import { ToastProvider } from "@/components/toast";
import { getOrg } from "@/lib/store";
import { isWhatsAppConfigured } from "@/lib/whatsapp/config";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Data changes on every send and webhook; never prerender the dashboard.
  await connection();
  const org = getOrg();
  const simulation = !isWhatsAppConfigured();

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-1 bg-cover md:bg-bg">
        <Sidebar organizerName={org.organizerName} orgName={org.name} />
        <div className="flex min-w-0 flex-1 flex-col bg-bg">
          {/* Phone cover bar */}
          <header className="flex items-center justify-between bg-cover px-5 pt-4 pb-3 text-cover-ink md:hidden">
            <Link href="/" aria-label="Nidaa home">
              <Wordmark compact />
            </Link>
            <span className="text-sm font-semibold text-cover-ink-muted">{org.organizerName}</span>
          </header>
          {simulation && (
            <p className="border-b border-line bg-maybe-bg px-5 py-2 text-[0.8125rem] leading-5 text-maybe-ink md:px-12">
              WhatsApp isn&apos;t connected yet, so messages are practice runs: they&apos;re written into each
              guest&apos;s history but nobody receives them.{" "}
              <Link href="/settings" className="font-semibold underline">
                Connect WhatsApp
              </Link>
            </p>
          )}
          <div className="flex flex-1 flex-col pb-20 md:pb-0">{children}</div>
        </div>
      </div>
      <MobileNav />
    </ToastProvider>
  );
}
