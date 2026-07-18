import Link from "next/link";
import { ArrowRight } from "./icons";
import { fmtLong, daysUntil, TODAY } from "@/lib/format";
import type { EventSummary } from "@/lib/mock-data";

export function EventCard({ event }: { event: EventSummary }) {
  const replied = event.invited - event.pending;
  const pct = Math.round((replied / event.invited) * 100);
  const days = daysUntil(event.date, TODAY);

  return (
    <article className="flex flex-col rounded-xl border border-line bg-bg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{event.name}</h3>
          <p className="tnum mt-0.5 whitespace-nowrap text-sm text-ink-muted">
            {`${fmtLong(event.date)} · in ${days} days`}
          </p>
        </div>
        <Link
          href={`/events/${event.id}`}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:border-line-strong hover:bg-surface"
        >
          View event
          <ArrowRight className="size-3.5 text-ink-faint" />
        </Link>
      </div>

      <dl className="tnum mt-5 grid grid-cols-4 gap-3">
        <div>
          <dt className="text-xs text-ink-muted">Attending</dt>
          <dd className="mt-0.5 text-xl font-semibold text-attending-ink">{event.attending}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Maybe</dt>
          <dd className="mt-0.5 text-xl font-semibold text-maybe-ink">{event.maybe}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Declined</dt>
          <dd className="mt-0.5 text-xl font-semibold text-declined-ink">{event.declined}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Pending</dt>
          <dd className="mt-0.5 text-xl font-semibold text-ink">{event.pending}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-ink-muted">Replies</span>
          <span className="tnum text-ink-muted">{`${replied} of ${event.invited} · ${pct}%`}</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${replied} of ${event.invited} guests have replied`}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface"
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </article>
  );
}
