import Link from "next/link";
import { ArrowRight } from "./icons";
import { HandTotal, MarginMark } from "./ink";
import { daysUntil, fmtClock, fmtInvitationDate, plural } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

/** Days left, written in the margin the way you'd count down on paper */
function MarginCountdown({ days }: { days: number }) {
  const [big, small] =
    days === 0 ? ["Today", ""] : days === 1 ? ["1", "day"] : days > 0 ? [String(days), "days"] : ["Past", ""];
  return (
    <p className="font-hand leading-none text-brand-600" aria-hidden>
      <span className={`block tnum ${small ? "text-[1.75rem] font-bold" : "text-lg font-bold"}`}>{big}</span>
      {small && <span className="text-sm">{small}</span>}
    </p>
  );
}

export function EventTally({ event }: { event: EventSummary }) {
  const items = [
    { status: "attending" as const, n: event.attendingGuests, label: "accepted" },
    { status: "maybe" as const, n: event.maybe, label: "maybe" },
    { status: "declined" as const, n: event.declined, label: "can't" },
  ];
  const waiting = event.pending - event.notInvited;
  return (
    <ul className="tnum flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.9375rem] text-ink-muted">
      {items.map((t) => (
        <li key={t.status} className="flex items-center gap-1">
          <MarginMark status={t.status} className="size-4" />
          <span className="font-semibold text-ink">{t.n}</span> {t.label}
        </li>
      ))}
      {waiting > 0 && (
        <li>
          <span className="font-semibold text-ink">{waiting}</span> no reply yet
        </li>
      )}
      {event.invalid > 0 && (
        <li className="flex items-center gap-1 text-invalid-ink">
          <MarginMark status="invalid" className="size-4" />
          <span className="font-semibold">{event.invalid}</span> unclear
        </li>
      )}
    </ul>
  );
}

export function EventEntry({ event, today }: { event: EventSummary; today: string }) {
  const days = daysUntil(event.date, today);
  const sentTo = event.invited - event.notInvited;

  return (
    <article className="group relative grid grid-cols-[var(--margin-x)_1fr] border-b border-line py-6 last:border-b-0">
      <div className="pt-1 pr-2 text-right">
        <MarginCountdown days={days} />
      </div>
      <div className="min-w-0 pl-4 sm:pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-bold tracking-[-0.015em] text-ink">
              <Link href={`/events/${event.id}`} className="after:absolute after:inset-0 hover:underline">
                {event.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-[0.9375rem] text-ink-muted">
              {`${fmtInvitationDate(event.date)}, ${fmtClock(event.time)}`}
              <span className="block sm:inline">
                <span className="hidden sm:inline"> · </span>
                {event.venue}
              </span>
            </p>
          </div>
          <ArrowRight className="mt-2 hidden size-4 shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-600 sm:block" />
        </div>

        {sentTo === 0 ? (
          <p className="mt-4 text-[0.9375rem] text-ink-muted">
            {event.invited ? (
              <>
                <span className="font-semibold text-ink">{plural(event.invited, "family", "families")}</span>
                {` (${plural(event.invitedSeats, "person", "people")}) on the list. Invitations haven't gone out yet.`}
              </>
            ) : (
              "No guests yet. Add your list to get started."
            )}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <EventTally event={event} />
            <div className="text-right">
              <p className="text-xs font-semibold text-ink-muted">Seats to set</p>
              <HandTotal value={event.attending} className="mt-1 text-[2.5rem]" />
              <p className="tnum mt-3 text-xs text-ink-muted">{`of ${event.invitedSeats} invited`}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
