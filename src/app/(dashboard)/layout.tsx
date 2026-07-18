import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { Wordmark } from "@/components/wordmark";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-line bg-sidebar px-5 py-3 md:hidden">
          <Link href="/">
            <Wordmark compact />
          </Link>
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            M
          </span>
        </header>
        {children}
      </div>
    </div>
  );
}
