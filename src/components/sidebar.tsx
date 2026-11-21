"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./wordmark";
import { DashboardIcon, CalendarIcon, GuestsIcon, SettingsIcon, LogoutIcon } from "./icons";

const nav = [
  { label: "Home", href: "/", icon: DashboardIcon },
  { label: "Events", href: "/events", icon: CalendarIcon },
  { label: "Guests", href: "/guests", icon: GuestsIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Desktop shell: the notebook's cover, with the open page as a white index tab */
export function Sidebar({ organizerName, orgName }: { organizerName: string; orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-cover text-cover-ink md:flex">
      <div className="px-6 pt-8 pb-8">
        <Link href="/" className="block rounded-md" aria-label="Nidaa home">
          <Wordmark />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 pl-4" aria-label="Main">
        {nav.map(({ label, href, icon: Icon }) => {
          const current = isCurrent(pathname, href);
          return (
            <Link
              key={label}
              href={href}
              aria-current={current ? "page" : undefined}
              className={
                current
                  ? "flex items-center gap-3 rounded-l-md bg-bg py-2.5 pr-4 pl-3 text-[0.9375rem] font-semibold text-ink"
                  : "mr-4 flex items-center gap-3 rounded-md py-2.5 pr-4 pl-3 text-[0.9375rem] font-medium text-cover-ink-muted transition-colors duration-150 hover:bg-cover-deep hover:text-cover-ink"
              }
            >
              <Icon className={current ? "size-4 text-brand-600" : "size-4"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-cover-ink/15 px-6 py-5">
        <p className="text-[0.9375rem] font-semibold">{organizerName}</p>
        <p className="text-sm text-cover-ink-muted">{orgName}</p>
        <a
          href="#"
          className="mt-3 inline-flex items-center gap-2 text-sm text-cover-ink-muted transition-colors duration-150 hover:text-cover-ink"
        >
          <LogoutIcon className="size-3.5" />
          Log out
        </a>
      </div>
    </aside>
  );
}

/** Phone shell: thumb-reach tabs along the bottom edge */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] grid grid-cols-4 border-t border-cover-deep bg-cover pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {nav.map(({ label, href, icon: Icon }) => {
        const current = isCurrent(pathname, href);
        return (
          <Link
            key={label}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex flex-col items-center gap-1 pt-2.5 pb-2 text-xs font-semibold transition-colors duration-150 ${
              current ? "text-cover-ink" : "text-cover-ink-muted"
            }`}
          >
            <Icon className="size-5" />
            {label}
            <span aria-hidden className={`h-0.5 w-6 rounded-full ${current ? "bg-rose" : "bg-transparent"}`} />
          </Link>
        );
      })}
    </nav>
  );
}
