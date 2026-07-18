import type { Metadata } from "next";
import { GuestExplorer } from "@/components/guest-explorer";
import { events, guests, type RsvpStatus } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Guests · Nidaa",
};

const validStatuses: RsvpStatus[] = ["attending", "declined", "maybe", "pending", "invalid"];

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initialStatus = validStatuses.includes(status as RsvpStatus)
    ? (status as RsvpStatus)
    : "all";
  const totalInvited = events.reduce((n, e) => n + e.invited, 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Guests</h1>
        <p className="tnum mt-1 text-sm text-ink-muted">
          {`Everyone you've invited, across ${events.length} events.`}
        </p>
      </div>

      <div className="mt-6">
        <GuestExplorer
          guests={guests}
          showEvent
          totalCount={totalInvited}
          initialStatus={initialStatus}
        />
      </div>
    </main>
  );
}
