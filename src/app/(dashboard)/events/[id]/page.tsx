import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { GuestExplorer } from "@/components/guest-explorer";
import { GuestListActions } from "@/components/guest-list-actions";
import { SendActions } from "@/components/send-actions";
import { publicMedia } from "@/lib/public-media";
import { HandTotal, MarginMark } from "@/components/ink";
import { EventTally } from "@/components/event-entry";
import { ChevronLeft } from "@/components/icons";
import { PageHeading, btnSecondary } from "@/components/ui";
import { getEventSummary, listGuests } from "@/lib/store";
import { fmtClock, fmtInvitationDate, fmtDaysAway, fmtWhen, daysUntil, plural, todayIso } from "@/lib/format";
import { sendingQuota } from "@/lib/quota";
import { isWhatsAppConfigured } from "@/lib/whatsapp/config";
import { requireUser } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = getEventSummary(id);
  return { title: event ? `${event.name} · Nidaa` : "Event · Nidaa" };
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guest?: string }>;
}) {
  await connection();
  await requireUser();
  const { id } = await params;
  const { guest: guestId } = await searchParams;
  const event = getEventSummary(id);
  if (!event) notFound();

  const guests = listGuests(event.id);
  const sentTo = event.invited - event.notInvited;
  // Same group the "Remind" button targets: invited, and no clear answer yet
  const unanswered = event.pending + event.invalid - event.notInvited;
  const replied = sentTo - unanswered;
  const days = daysUntil(event.date, todayIso());
  const quota = sendingQuota();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-12 md:py-12">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition-colors duration-150 hover:text-ink"
      >
        <ChevronLeft className="size-3.5" />
        All events
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.025em] md:text-[2.5rem]">{event.name}</h1>
          <p className="mt-1.5 text-base text-ink-muted md:text-lg">
            {`${fmtInvitationDate(event.date)}, ${fmtClock(event.time)} · ${event.venue}`}
          </p>
          <p className="mt-1 font-hand text-lg text-brand-600">{fmtDaysAway(days)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/events/${event.id}/edit`} className={btnSecondary}>
            Edit details
          </Link>
          {days >= 0 && (
            <SendActions
              event={{ ...event, media: null }}
              media={publicMedia(event.media)}
              quota={{ limit: quota.limit, remaining: quota.remaining, nextSlotAt: quota.nextSlotAt }}
              simulation={!isWhatsAppConfigured()}
            />
          )}
        </div>
      </header>

      <section aria-label="Headcount" className="mt-10 border-y border-ink/80 py-7">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <p className="text-sm font-semibold text-ink-muted">Seats to set</p>
            <HandTotal value={event.attending} className="mt-2 text-[4rem]" />
            <p className="mt-4 text-[0.9375rem] text-ink-muted">
              {sentTo === 0
                ? "No invitations sent yet."
                : `${plural(event.attending, "person", "people")} from ${plural(event.attendingGuests, "accepted invitation")}`}
            </p>
            <p className="tnum text-[0.9375rem] text-ink-muted">
              {`of ${plural(event.invitedSeats, "person", "people")} invited across ${plural(event.invited, "family", "families")}`}
            </p>
          </div>
          <EventTally event={event} />
        </div>

        <p className="tnum mt-6 border-t border-line pt-4 text-[0.9375rem]">
          {sentTo === 0 ? (
            <span className="text-ink-muted">{`${plural(event.notInvited, "guest")} on the list, waiting for their invitation.`}</span>
          ) : (
            <>
              <span className="font-semibold">{`${replied} of ${sentTo}`}</span>
              <span className="text-ink-muted"> have answered clearly</span>
              {unanswered > 0 && <span className="text-ink-muted">{` · ${unanswered} still without a clear answer`}</span>}
              {event.notInvited - event.queuedInvitations > 0 && (
                <span className="text-ink-muted">{` · ${event.notInvited - event.queuedInvitations} not invited yet`}</span>
              )}
            </>
          )}
        </p>

        {event.queuedInvitations + event.queuedReminders > 0 && (
          <p className="tnum mt-3 text-[0.9375rem] text-ink-muted">
            <span className="font-semibold text-ink">
              {[
                event.queuedInvitations && plural(event.queuedInvitations, "invitation"),
                event.queuedReminders && plural(event.queuedReminders, "reminder"),
              ]
                .filter(Boolean)
                .join(" and ")}
              {" queued"}
            </span>
            {` under WhatsApp's daily limit. They go out automatically ${
              quota.nextSlotAt ? `from ${fmtWhen(quota.nextSlotAt)}` : "as soon as there's room"
            }.`}
          </p>
        )}
        {event.failed > 0 && (
          <p className="mt-3 flex items-start gap-2 text-[0.9375rem] text-declined-ink">
            <MarginMark status="invalid" className="mt-0.5 size-5" />
            {`${plural(event.failed, "guest")} didn't receive the last message. They're marked in the list below.`}
          </p>
        )}
      </section>

      <section aria-labelledby="guests-heading" className="mt-14">
        <PageHeading id="guests-heading" aside={<GuestListActions eventId={event.id} defaultSeats={event.maxPartySize} />}>
          Guest list
        </PageHeading>
        <div className="mt-4">
          <GuestExplorer
            guests={guests}
            events={{ [event.id]: { name: event.name } }}
            initialGuestId={guests.some((g) => g.id === guestId) ? guestId : undefined}
            simulation={!isWhatsAppConfigured()}
          />
        </div>
      </section>
    </main>
  );
}
