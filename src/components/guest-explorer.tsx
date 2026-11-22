"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "./status-badge";
import { GuestDrawer, type EventInfo } from "./guest-drawer";
import { HandTotal, MarginMark } from "./ink";
import { SearchIcon } from "./icons";
import { fmtShort } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { statusLabels, type Guest, type RsvpStatus } from "@/lib/types";

type Filter = RsvpStatus | "all";

type Props = {
  guests: Guest[];
  events: Record<string, EventInfo>;
  /** Show the event column (used on the all-guests page) */
  showEvent?: boolean;
  initialStatus?: Filter;
  initialGuestId?: string;
  simulation: boolean;
};

const filters: Filter[] = ["all", "attending", "maybe", "declined", "pending", "invalid"];

function lastOutboundFailed(g: Guest) {
  for (let i = g.timeline.length - 1; i >= 0; i--) {
    if (g.timeline[i].from === "nidaa") return g.timeline[i].delivery === "failed";
  }
  return false;
}

function lastGuestWords(g: Guest) {
  for (let i = g.timeline.length - 1; i >= 0; i--) {
    if (g.timeline[i].from === "guest") return g.timeline[i].text;
  }
  return null;
}

function GuestNote({ guest }: { guest: Guest }) {
  if (guest.optedOutAt) return <span className="text-ink-muted">Asked for no more messages</span>;
  if (lastOutboundFailed(guest)) return <span className="font-semibold text-declined-ink">Message didn&apos;t arrive</span>;
  if (guest.queued?.kind === "invitation") return <span className="text-ink-muted">Invitation queued for later</span>;
  if (guest.queued?.kind === "chase") return <span className="text-ink-muted">Reminder queued for later</span>;
  if (!guest.invitedAt) return <span className="text-ink-faint">Not invited yet</span>;
  const words = guest.status === "invalid" ? lastGuestWords(guest) : null;
  // Their actual words, noted in pen, so the host can answer for them
  if (words)
    return (
      <span className="font-hand text-[0.9375rem] leading-tight text-brand-600">
        <span className="sr-only">They wrote: </span>“{words.length > 60 ? `${words.slice(0, 58)}…` : words}”
      </span>
    );
  return null;
}

/** The seat count summed by hand at the foot of the list */
function FootSum({ guests, label }: { guests: Guest[]; label: string }) {
  const seats = guests.reduce((n, g) => n + (g.status === "attending" ? Math.max(g.partySize, 1) : 0), 0);
  return (
    <div className="flex items-end justify-between gap-4 pt-3 pb-1">
      <p className="text-[0.9375rem] font-semibold">{label}</p>
      <HandTotal value={seats} className="text-[2.25rem]" />
    </div>
  );
}

/** Coming out of invited: "3 of 5", the coming number in pen */
function PartySize({ guest }: { guest: Guest }) {
  return (
    <span className="whitespace-nowrap">
      {guest.status === "attending" ? (
        <span className="font-hand text-lg leading-none font-bold text-brand-600">{guest.partySize}</span>
      ) : (
        <span className="text-ink-faint">—</span>
      )}
      <span className="text-ink-faint">{` of ${guest.seats}`}</span>
    </span>
  );
}

export function GuestExplorer({ guests, events, showEvent = false, initialStatus = "all", initialGuestId, simulation }: Props) {
  const [filter, setFilter] = useState<Filter>(initialStatus);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialGuestId ?? null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: guests.length, attending: 0, maybe: 0, declined: 0, pending: 0, invalid: 0 };
    for (const g of guests) c[g.status]++;
    return c;
  }, [guests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return guests.filter(
      (g) =>
        (filter === "all" || g.status === filter) &&
        (q === "" || g.name.toLowerCase().includes(q) || (qDigits !== "" && g.phone.includes(qDigits)))
    );
  }, [guests, filter, query]);

  const selected = selectedId ? guests.find((g) => g.id === selectedId) : undefined;
  const footLabel = filter === "all" && !query ? "Seats to set" : "Seats among these guests";
  const eventName = (id: string) => events[id]?.name ?? id;
  const emptyText = query
    ? `Nobody on the list matches “${query}”.`
    : filter === "all"
      ? "Nobody here yet."
      : `Nobody with “${statusLabels[filter as RsvpStatus]}” right now.`;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-x-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-wrap" role="group" aria-label="Show guests by reply">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={`tnum shrink-0 whitespace-nowrap px-2 py-1.5 text-[0.9375rem] transition-colors duration-150 ${
                  active
                    ? "font-semibold text-ink underline decoration-brand-600 decoration-2 underline-offset-[7px]"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {f === "all" ? "Everyone" : statusLabels[f]}
                <span className={active ? "ml-1.5 text-brand-600" : "ml-1.5 text-ink-faint"}>{counts[f]}</span>
              </button>
            );
          })}
        </div>
        <label className="relative block lg:w-64">
          <span className="sr-only">Find a guest by name or phone</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a guest"
            className="w-full rounded-md border border-control bg-bg py-2 pr-3 pl-9 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </label>
      </div>

      {guests.length === 0 ? (
        <div className="ruled-margin mt-4 border-t border-ink/80 py-12 pl-[calc(var(--margin-x)+1.5rem)] [--margin-x:3rem]">
          <p className="text-lg font-semibold">The list is empty.</p>
          <p className="mt-1 max-w-[52ch] text-ink-muted">
            Import a spreadsheet or add guests one by one. Once they&apos;re here, send the invitations and watch the ticks come in.
          </p>
        </div>
      ) : (
        <>
          {/* Wide screens: a real table, ruled like the page */}
          <div className="ruled-margin mt-4 hidden [--margin-x:3rem] sm:block">
            <table className="w-full text-[0.9375rem]">
              <thead>
                <tr className="border-b border-ink/80 text-left text-[0.8125rem] text-ink-muted">
                  <th scope="col" className="w-12">
                    <span className="sr-only">Mark</span>
                  </th>
                  <th scope="col" className="py-2 pl-6 font-semibold">Guest</th>
                  {showEvent && <th scope="col" className="py-2 pr-4 font-semibold">Event</th>}
                  <th scope="col" className="py-2 pr-4 font-semibold">Reply</th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">Coming</th>
                  <th scope="col" className="py-2 pr-2 text-right font-semibold">Replied</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => {
                  const isSelected = g.id === selectedId;
                  return (
                    <tr
                      key={g.id}
                      onClick={() => setSelectedId(g.id)}
                      className={`cursor-pointer border-b border-line transition-colors duration-150 ${
                        isSelected ? "bg-brand-050" : "hover:bg-surface"
                      }`}
                    >
                      <td className="w-12 pr-2">
                        <span className="flex justify-end">
                          <MarginMark status={g.status} className="size-6" />
                        </span>
                      </td>
                      <td className="py-2.5 pl-6">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(g.id);
                          }}
                          className="text-left font-semibold text-ink hover:underline"
                        >
                          {g.name}
                        </button>
                        <p className="tnum flex flex-wrap gap-x-3 text-[0.8125rem] text-ink-muted">
                          {formatPhone(g.phone)}
                          <GuestNote guest={g} />
                        </p>
                      </td>
                      {showEvent && <td className="py-2.5 pr-4 text-ink-muted">{eventName(g.eventId)}</td>}
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={g.status} mark={false} />
                      </td>
                      <td className="tnum py-2.5 pr-4 text-right">
                        <PartySize guest={g} />
                      </td>
                      <td className="tnum py-2.5 pr-2 text-right text-ink-muted">{g.updatedAt ? fmtShort(g.updatedAt) : "—"}</td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td />
                    <td colSpan={showEvent ? 5 : 4} className="py-10 pl-6 text-ink-muted">
                      {emptyText}
                    </td>
                  </tr>
                )}
              </tbody>
              {visible.some((g) => g.status === "attending") && (
                <tfoot>
                  <tr className="border-t-2 border-ink/80">
                    <td />
                    <td colSpan={showEvent ? 5 : 4} className="pl-6">
                      <FootSum guests={visible} label={footLabel} />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Phones: the same list, one name per line */}
          <ul className="ruled-margin mt-3 border-t border-ink/80 [--margin-x:2.5rem] sm:hidden">
            {visible.map((g) => (
              <li key={g.id} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  className="grid w-full grid-cols-[var(--margin-x)_1fr_auto] items-center gap-y-0.5 py-3 pr-1 text-left active:bg-surface"
                >
                  <span className="flex justify-end pr-2">
                    <MarginMark status={g.status} className="size-6" />
                  </span>
                  <span className="min-w-0 pl-4">
                    <span className="block truncate font-semibold">{g.name}</span>
                    <span className="tnum block truncate text-[0.8125rem] text-ink-muted">
                      {`${showEvent ? eventName(g.eventId) : formatPhone(g.phone)} · for ${g.seats}`}
                    </span>
                    <span className="block text-[0.8125rem]">
                      <GuestNote guest={g} />
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5 pl-2">
                    <StatusBadge status={g.status} mark={false} />
                    {g.status === "attending" && (
                      <span className="text-[0.8125rem] text-ink-muted">
                        <PartySize guest={g} /> coming
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="py-8 pl-[calc(var(--margin-x)+1rem)] text-ink-muted">{emptyText}</li>}
            {visible.some((g) => g.status === "attending") && (
              <li className="border-t-2 border-ink/80 pr-1 pl-[calc(var(--margin-x)+1rem)]">
                <FootSum guests={visible} label={footLabel} />
              </li>
            )}
          </ul>
        </>
      )}

      {selected && events[selected.eventId] && (
        <GuestDrawer
          key={selected.id}
          guest={selected}
          event={events[selected.eventId]}
          simulation={simulation}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
