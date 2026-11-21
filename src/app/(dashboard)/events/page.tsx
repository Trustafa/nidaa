import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EventEntry } from "@/components/event-entry";
import { PageHeading, btnPrimary } from "@/components/ui";
import { listEvents } from "@/lib/store";
import { plural, todayIso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Events · Nidaa",
};

export default async function EventsPage() {
  await connection();
  const today = todayIso();
  const events = listEvents();
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today).reverse();
  const totalInvited = events.reduce((n, e) => n + e.invited, 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-12 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.025em] md:text-[2.5rem]">Your events</h1>
          <p className="tnum mt-2 text-base text-ink-muted md:text-lg">
            {events.length
              ? `${plural(events.length, "event")}, ${plural(totalInvited, "guest")} on the lists.`
              : "Nothing planned yet."}
          </p>
        </div>
        <Link href="/events/new" className={btnPrimary}>
          New event
        </Link>
      </header>

      {events.length === 0 && (
        <p className="mt-10 border-t border-ink/80 py-10 text-ink-muted">
          Create an event to start inviting guests over WhatsApp.
        </p>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="mt-10">
          <PageHeading id="upcoming-heading">Coming up</PageHeading>
          <div className="ruled-margin [--margin-x:3.25rem] sm:[--margin-x:4.5rem]">
            {upcoming.map((event) => (
              <EventEntry key={event.id} event={event} today={today} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="mt-14">
          <PageHeading id="past-heading">Already happened</PageHeading>
          <div className="ruled-margin opacity-80 [--margin-x:3.25rem] sm:[--margin-x:4.5rem]">
            {past.map((event) => (
              <EventEntry key={event.id} event={event} today={today} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
