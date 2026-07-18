"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "./status-badge";
import { GuestDrawer } from "./guest-drawer";
import { fmtShort } from "@/lib/format";
import { events, statusLabels, type Guest, type RsvpStatus } from "@/lib/mock-data";

type Filter = RsvpStatus | "all";

type Props = {
  guests: Guest[];
  /** Show the event column (used on the all-guests page) */
  showEvent?: boolean;
  /** Total guests in the real list, when the mock subset is smaller */
  totalCount?: number;
  initialStatus?: Filter;
};

const filters: Filter[] = ["all", "attending", "maybe", "declined", "pending", "invalid"];

function eventName(eventId: string) {
  return events.find((e) => e.id === eventId)?.name ?? eventId;
}

export function GuestExplorer({ guests, showEvent = false, totalCount, initialStatus = "all" }: Props) {
  const [filter, setFilter] = useState<Filter>(initialStatus);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: guests.length,
      attending: 0,
      maybe: 0,
      declined: 0,
      pending: 0,
      invalid: 0,
    };
    for (const g of guests) c[g.status]++;
    return c;
  }, [guests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter(
      (g) =>
        (filter === "all" || g.status === filter) &&
        (q === "" || g.name.toLowerCase().includes(q) || g.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")))
    );
  }, [guests, filter, query]);

  const selected = selectedId ? guests.find((g) => g.id === selectedId) : null;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by RSVP status">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={`tnum whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                  active
                    ? "bg-brand-600 text-white"
                    : "border border-line text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {`${f === "all" ? "All" : statusLabels[f]} · ${counts[f]}`}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or phone"
          aria-label="Search guests by name or phone"
          className="w-full rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand-300 focus:outline-none sm:w-56"
        />
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-line sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-xs text-ink-muted">
              <th scope="col" className="px-4 py-2.5 font-medium">Guest</th>
              {showEvent && <th scope="col" className="px-4 py-2.5 font-medium">Event</th>}
              <th scope="col" className="px-4 py-2.5 font-medium">RSVP</th>
              <th scope="col" className="tnum px-4 py-2.5 text-right font-medium">Party</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((g) => (
              <tr
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className="cursor-pointer border-b border-line last:border-b-0 transition-colors duration-150 hover:bg-surface"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{g.name}</p>
                  <p className="tnum mt-0.5 text-xs text-ink-muted">{g.phone}</p>
                </td>
                {showEvent && <td className="px-4 py-3 text-ink-muted">{eventName(g.eventId)}</td>}
                <td className="px-4 py-3">
                  <StatusBadge status={g.status} />
                </td>
                <td className="tnum px-4 py-3 text-right text-ink-muted">
                  {g.partySize > 0 ? g.partySize : "—"}
                </td>
                <td className="tnum px-4 py-3 text-right text-ink-muted">
                  {g.updatedAt ? fmtShort(g.updatedAt) : "—"}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={showEvent ? 5 : 4} className="px-4 py-10 text-center text-sm text-ink-muted">
                  {query
                    ? `No guests match "${query}".`
                    : `No guests with status "${filter === "all" ? "any" : statusLabels[filter as RsvpStatus]}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="mt-4 flex flex-col gap-2 sm:hidden">
        {visible.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => setSelectedId(g.id)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 text-left transition-colors duration-150 hover:border-line-strong"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="tnum truncate text-xs text-ink-muted">
                  {showEvent ? `${eventName(g.eventId)} · ${g.phone}` : g.phone}
                </p>
              </div>
              <StatusBadge status={g.status} />
            </button>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="rounded-xl border border-line px-4 py-8 text-center text-sm text-ink-muted">
            {query ? `No guests match "${query}".` : "No guests with this status."}
          </li>
        )}
      </ul>

      {totalCount !== undefined && totalCount > guests.length && (
        <p className="tnum mt-3 text-xs text-ink-faint">
          {`Showing ${guests.length} of ${totalCount} guests in this preview.`}
        </p>
      )}

      {selected && (
        <GuestDrawer
          guest={selected}
          eventName={eventName(selected.eventId)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
