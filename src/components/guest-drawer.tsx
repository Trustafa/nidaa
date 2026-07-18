"use client";

import { useEffect, useRef } from "react";
import { StatusBadge } from "./status-badge";
import { fmtTime } from "@/lib/format";
import type { Guest } from "@/lib/mock-data";

type Props = {
  guest: Guest;
  eventName: string;
  onClose: () => void;
};

export function GuestDrawer({ guest, eventName, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-[var(--z-drawer-backdrop)] bg-ink/25 animate-[fade-in_150ms_ease-out]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Guest details for ${guest.name}`}
        className="fixed inset-y-0 right-0 z-[var(--z-drawer)] flex w-full max-w-md flex-col bg-bg shadow-xl animate-[drawer-in_200ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <header className="border-b border-line px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{guest.name}</h2>
              <p className="tnum mt-0.5 text-sm text-ink-muted">{guest.phone}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close guest details"
              className="flex size-8 items-center justify-center rounded-lg text-ink-faint transition-colors duration-150 hover:bg-surface hover:text-ink"
            >
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="size-4"
              >
                <path d="m4 4 8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-ink-muted">RSVP</dt>
              <dd>
                <StatusBadge status={guest.status} />
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-ink-muted">Party size</dt>
              <dd className="tnum font-medium">{guest.partySize > 0 ? guest.partySize : "—"}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-ink-muted">Event</dt>
              <dd className="font-medium">{eventName}</dd>
            </div>
          </dl>
        </header>

        <div className="flex-1 overflow-y-auto bg-surface px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            WhatsApp conversation
          </h3>
          <ol className="mt-3 flex flex-col gap-2.5">
            {guest.timeline.map((entry, i) => (
              <li
                key={i}
                className={entry.from === "nidaa" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-5 ${
                    entry.from === "nidaa"
                      ? "rounded-br-sm bg-brand-100 text-ink"
                      : "rounded-bl-sm border border-line bg-bg text-ink"
                  }`}
                >
                  <p>{entry.text}</p>
                  <p className="tnum mt-1 text-[0.6875rem] text-ink-faint">{fmtTime(entry.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <footer className="flex gap-2 border-t border-line px-6 py-4">
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700"
          >
            Resend invitation
          </button>
          <button
            type="button"
            className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-line-strong hover:bg-surface"
          >
            Edit guest
          </button>
        </footer>
      </div>
    </>
  );
}
