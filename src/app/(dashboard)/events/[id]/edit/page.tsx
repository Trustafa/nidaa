import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EventForm } from "@/components/event-form";
import { publicMedia } from "@/lib/public-media";
import { DeleteEventButton } from "@/components/delete-event-button";
import { ChevronLeft } from "@/components/icons";
import { getEventSummary } from "@/lib/store";
import { todayIso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Edit event · Nidaa",
};

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const event = getEventSummary(id);
  if (!event) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-12 md:py-12">
      <Link
        href={`/events/${event.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition-colors duration-150 hover:text-ink"
      >
        <ChevronLeft className="size-3.5" />
        {event.name}
      </Link>
      <h1 className="mt-4 text-[2rem] leading-tight font-bold tracking-[-0.025em] md:text-[2.5rem]">Edit details</h1>
      {event.invited - event.notInvited > 0 && (
        <p className="mt-2 max-w-[60ch] text-base text-ink-muted">
          Changes apply to reminders and anything sent from now on. Guests who were already invited aren&apos;t notified.
        </p>
      )}
      <div className="mt-10">
        <EventForm event={{ ...event, media: null }} initialMedia={publicMedia(event.media)} minDate={todayIso()} />
      </div>

      <section aria-labelledby="danger-heading" className="mt-16 max-w-2xl border-t border-ink/80 pt-6">
        <h2 id="danger-heading" className="text-lg font-bold tracking-[-0.01em]">
          Delete this event
        </h2>
        <p className="mt-1 max-w-[60ch] text-[0.9375rem] text-ink-muted">
          Removes the event, its guest list and every conversation. Guests aren&apos;t told. This can&apos;t be undone.
        </p>
        <div className="mt-4">
          <DeleteEventButton eventId={event.id} eventName={event.name} guestCount={event.invited} />
        </div>
      </section>
    </main>
  );
}
