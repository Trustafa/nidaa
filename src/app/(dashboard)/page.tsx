import Link from "next/link";
import { connection } from "next/server";
import { StatusBadge } from "@/components/status-badge";
import { MiniCalendar } from "@/components/mini-calendar";
import { EventEntry } from "@/components/event-entry";
import { MarginMark } from "@/components/ink";
import { ArrowRight } from "@/components/icons";
import { PageHeading, btnPrimary } from "@/components/ui";
import { getOrg, listEvents, listGuests } from "@/lib/store";
import { fmtAgo, fmtWhen, greeting, plural, todayIso } from "@/lib/format";
import { sendingQuota } from "@/lib/quota";

export default async function Home() {
  await connection();
  const today = todayIso();
  const org = getOrg();
  const events = listEvents();
  const upcoming = events.filter((e) => e.date >= today);
  const eventNames = new Map(events.map((e) => [e.id, e.name]));

  const awaitingReply = upcoming.reduce((n, e) => n + e.pending - e.notInvited, 0);
  const unclear = upcoming.reduce((n, e) => n + e.invalid, 0);
  const undelivered = upcoming.reduce((n, e) => n + e.failed, 0);
  const notSent = upcoming.filter((e) => e.notInvited - e.queuedInvitations > 0);
  const quota = sendingQuota();

  const latestReplies = listGuests()
    .filter((g) => g.updatedAt)
    .sort((a, b) => b.updatedAt!.localeCompare(a.updatedAt!))
    .slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-12 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.025em] md:text-[2.5rem]">
            {`${greeting()}, ${org.organizerName}.`}
          </h1>
          <p className="tnum mt-2 max-w-[60ch] text-base text-ink-muted md:text-lg">
            {upcoming.length === 0
              ? "Nothing on the calendar yet."
              : awaitingReply > 0
                ? `${plural(awaitingReply, "guest")} haven't replied yet. Nidaa will keep reminding them for you.`
                : "Everyone you've invited has replied."}
          </p>
        </div>
        <Link href="/events/new" className={btnPrimary}>
          New event
        </Link>
      </header>

      <div className="mt-10 grid gap-12 xl:grid-cols-[1fr_19rem]">
        <div className="min-w-0">
          <section aria-labelledby="upcoming-heading">
            <PageHeading id="upcoming-heading">Coming up</PageHeading>
            {upcoming.length ? (
              <div className="ruled-margin [--margin-x:3.25rem] sm:[--margin-x:4.5rem]">
                {upcoming.map((event) => (
                  <EventEntry key={event.id} event={event} today={today} />
                ))}
              </div>
            ) : (
              <div className="py-12">
                <p className="text-lg font-semibold">The first page is blank.</p>
                <p className="mt-1 max-w-[52ch] text-ink-muted">
                  Add an event and your guest list, and Nidaa sends the invitations and keeps count of every reply.
                </p>
                <Link href="/events/new" className={`mt-5 ${btnPrimary}`}>
                  Start your first event
                </Link>
              </div>
            )}
          </section>

          <section aria-labelledby="activity-heading" className="mt-14">
            <PageHeading
              id="activity-heading"
              aside={
                <Link href="/guests" className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline">
                  Everyone on your lists
                </Link>
              }
            >
              Just replied
            </PageHeading>

            {latestReplies.length === 0 ? (
              <p className="py-8 text-ink-muted">Replies appear here the moment guests answer on WhatsApp.</p>
            ) : (
              <ul className="ruled-margin [--margin-x:3.25rem] sm:[--margin-x:4.5rem]">
                {latestReplies.map((g) => (
                  <li key={g.id} className="relative grid grid-cols-[var(--margin-x)_1fr] border-b border-line last:border-b-0">
                    <span className="flex items-center justify-end pr-3">
                      <MarginMark status={g.status} className="size-6" />
                    </span>
                    <div className="flex min-w-0 items-center justify-between gap-3 py-3 pl-4 sm:pl-6">
                      <div className="min-w-0">
                        <Link
                          href={`/events/${g.eventId}?guest=${g.id}`}
                          className="font-semibold after:absolute after:inset-0 hover:underline"
                        >
                          {g.name}
                        </Link>
                        <p className="truncate text-sm text-ink-muted">
                          {`${eventNames.get(g.eventId)} · ${fmtAgo(g.updatedAt!)}`}
                        </p>
                      </div>
                      <StatusBadge status={g.status} mark={false} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-10 xl:sticky xl:top-10 xl:self-start">
          <MiniCalendar today={today} eventDates={events.map((e) => ({ date: e.date, label: e.name }))} />

          {(unclear > 0 || undelivered > 0 || notSent.length > 0 || quota.queued > 0) && (
            <section aria-labelledby="notes-heading">
              <h2 id="notes-heading" className="border-b border-ink/80 pb-2 text-lg font-bold tracking-[-0.01em]">
                To look at
              </h2>
              <ul className="divide-y divide-line">
                {unclear > 0 && (
                  <li>
                    <Link href="/guests?status=invalid" className="flex gap-3 py-3 hover:[&_strong]:underline">
                      <MarginMark status="invalid" className="mt-0.5 size-5" />
                      <span className="text-[0.9375rem]">
                        <strong className="font-semibold">{`${plural(unclear, "reply", "replies")} Nidaa couldn't read`}</strong>
                        <span className="block text-sm text-ink-muted">Have a look and answer for them, or resend.</span>
                      </span>
                    </Link>
                  </li>
                )}
                {undelivered > 0 && (
                  <li className="flex gap-3 py-3">
                    <MarginMark status="invalid" className="mt-0.5 size-5" />
                    <span className="text-[0.9375rem]">
                      <strong className="font-semibold">{`${plural(undelivered, "message")} didn't arrive`}</strong>
                      <span className="block text-sm text-ink-muted">Usually a wrong number, or one that isn&apos;t on WhatsApp.</span>
                    </span>
                  </li>
                )}
                {notSent.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.id}`} className="flex gap-3.5 py-3 pl-0.5 hover:[&_strong]:underline">
                      <ArrowRight className="mt-1 size-4 shrink-0 text-brand-600" />
                      <span className="text-[0.9375rem]">
                        <strong className="font-semibold">{`Invitations for ${e.name} haven't gone out`}</strong>
                        <span className="block text-sm text-ink-muted">{`${plural(e.notInvited - e.queuedInvitations, "guest")} waiting to hear from you.`}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                {quota.queued > 0 && (
                  <li className="flex gap-3.5 py-3 pl-0.5">
                    <ArrowRight className="mt-1 size-4 shrink-0 text-ink-faint" />
                    <span className="text-[0.9375rem]">
                      <strong className="font-semibold">{`${plural(quota.queued, "message")} in the queue`}</strong>
                      <span className="block text-sm text-ink-muted">
                        {`Held back by WhatsApp's daily limit. They go out automatically ${
                          quota.nextSlotAt ? `from ${fmtWhen(quota.nextSlotAt)}` : "as soon as there's room"
                        }.`}
                      </span>
                    </span>
                  </li>
                )}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
