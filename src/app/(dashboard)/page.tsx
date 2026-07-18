import { StatusBadge } from "@/components/status-badge";
import { MiniCalendar } from "@/components/mini-calendar";
import { EventCard } from "@/components/event-card";
import { events, recentActivity } from "@/lib/mock-data";
import { fmtShort, TODAY } from "@/lib/format";

export default function Home() {
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const totalPending = events.reduce((n, e) => n + e.pending, 0);
  const needsAttention = events.reduce((n, e) => n + e.invalid, 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, Mustafa</h1>
        <p className="tnum mt-1 text-sm text-ink-muted">
          {`${upcoming.length} events on the go. ${totalPending} guests haven't replied yet.`}
        </p>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <section aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="text-sm font-semibold text-ink-muted">
              Upcoming events
            </h2>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          <section aria-labelledby="activity-heading" className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 id="activity-heading" className="text-sm font-semibold text-ink-muted">
                Latest replies
              </h2>
              <a
                href="/guests"
                className="text-sm font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700"
              >
                View all guests
              </a>
            </div>

            {/* Desktop table */}
            <div className="mt-3 hidden overflow-hidden rounded-xl border border-line sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface text-left text-xs text-ink-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium">Guest</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Event</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">RSVP</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-line last:border-b-0 transition-colors duration-150 hover:bg-surface"
                    >
                      <td className="px-4 py-3 font-medium">{row.guest}</td>
                      <td className="px-4 py-3 text-ink-muted">{row.event}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="tnum px-4 py-3 text-right text-ink-muted">
                        {fmtShort(row.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="mt-3 flex flex-col gap-2 sm:hidden">
              {recentActivity.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.guest}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {`${row.event} · ${fmtShort(row.updatedAt)}`}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-8 xl:self-start">
          <MiniCalendar
            today={TODAY}
            eventDates={events.map((e) => ({ date: e.date, label: e.name }))}
          />
          {needsAttention > 0 && (
            <a
              href="/guests?status=invalid"
              className="group rounded-xl border border-line bg-bg p-4 transition-colors duration-150 hover:border-line-strong"
            >
              <p className="flex items-center gap-2 text-sm font-medium text-invalid-ink">
                <span aria-hidden className="size-1.5 rounded-full bg-invalid-dot" />
                {`${needsAttention} replies need attention`}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                Guests answered in a way Nidaa couldn&apos;t read. Review them and resend.
              </p>
            </a>
          )}
        </aside>
      </div>
    </main>
  );
}
