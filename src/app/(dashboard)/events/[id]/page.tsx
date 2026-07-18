import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestExplorer } from "@/components/guest-explorer";
import { ChevronLeft } from "@/components/icons";
import { events, guests } from "@/lib/mock-data";
import { fmtLong, daysUntil, TODAY } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = events.find((e) => e.id === id);
  return { title: event ? `${event.name} · Nidaa` : "Event · Nidaa" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = events.find((e) => e.id === id);
  if (!event) notFound();

  const eventGuests = guests.filter((g) => g.eventId === event.id);
  const replied = event.invited - event.pending;
  const pct = Math.round((replied / event.invited) * 100);
  const days = daysUntil(event.date, TODAY);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors duration-150 hover:text-ink"
      >
        <ChevronLeft className="size-3.5" />
        Events
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
          <p className="tnum mt-1 text-sm text-ink-muted">
            {`${fmtLong(event.date)} · in ${days} days · ${event.invited} guests invited`}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="#"
            className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-line-strong hover:bg-surface"
          >
            Edit event
          </a>
          <a
            href="#"
            className="tnum rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700"
          >
            {`Send invitations to ${event.pending} pending guests`}
          </a>
        </div>
      </div>

      <section aria-label="Headcount summary" className="mt-6 rounded-xl border border-line bg-bg p-5">
        <dl className="tnum grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-5">
          <div>
            <dt className="text-xs text-ink-muted">Attending</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-attending-ink">{event.attending}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Maybe</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-maybe-ink">{event.maybe}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Can&apos;t make it</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-declined-ink">{event.declined}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Pending</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-ink">{event.pending}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Needs attention</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-invalid-ink">{event.invalid}</dd>
          </div>
        </dl>
        <div className="mt-5">
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
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="guests-heading" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="guests-heading" className="text-sm font-semibold text-ink-muted">
            Guest list
          </h2>
          <div className="flex gap-2">
            <a
              href="#"
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:border-line-strong hover:bg-surface"
            >
              Import CSV
            </a>
            <a
              href="#"
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:border-line-strong hover:bg-surface"
            >
              Add guest
            </a>
          </div>
        </div>
        <div className="mt-4">
          <GuestExplorer guests={eventGuests} totalCount={event.invited} />
        </div>
      </section>
    </main>
  );
}
