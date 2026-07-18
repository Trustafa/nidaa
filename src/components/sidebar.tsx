"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./wordmark";
import {
  DashboardIcon,
  CalendarIcon,
  GuestsIcon,
  SettingsIcon,
  LogoutIcon,
  ChevronDown,
} from "./icons";

const nav = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Events", href: "/events", icon: CalendarIcon },
  { label: "Guests", href: "/guests", icon: GuestsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-line bg-sidebar">
      <div className="px-6 pt-8 pb-6">
        <Link href="/" className="block">
          <Wordmark />
        </Link>
      </div>

      <div className="px-4">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-line bg-bg px-3 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-line-strong"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              M
            </span>
            Mustafa
          </span>
          <ChevronDown className="size-3.5 text-ink-faint" />
        </button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5 px-4" aria-label="Main">
        {nav.map(({ label, href, icon: Icon }) => {
          const current = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              aria-current={current ? "page" : undefined}
              className={
                current
                  ? "flex items-center gap-3 rounded-lg bg-brand-050 px-3 py-2 text-sm font-medium text-brand-700"
                  : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hover:bg-bg hover:text-ink"
              }
            >
              <Icon className={current ? "size-4 text-brand-600" : "size-4 text-ink-faint"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-line px-4 py-4">
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hover:bg-bg hover:text-ink"
        >
          <SettingsIcon className="size-4 text-ink-faint" />
          Settings
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hover:bg-bg hover:text-ink"
        >
          <LogoutIcon className="size-4 text-ink-faint" />
          Log out
        </a>
      </div>
    </aside>
  );
}
