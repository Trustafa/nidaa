import type { Metadata } from "next";
import { EventCard } from "@/components/event-card";
import { events } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Events · Nidaa",
};

export default function EventsPage() {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const totalInvited = events.reduce((n, e) => n + e.invited, 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="tnum mt-1 text-sm text-ink-muted">
            {`${events.length} events · ${totalInvited} guests invited in total.`}
          </p>
        </div>
        <a
          href="#"
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700"
        >
          New event
        </a>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {sorted.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </main>
  );
}
