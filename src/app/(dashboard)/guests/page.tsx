import type { Metadata } from "next";
import { connection } from "next/server";
import { GuestExplorer } from "@/components/guest-explorer";
import { listEvents, listGuests } from "@/lib/store";
import { plural } from "@/lib/format";
import { isWhatsAppConfigured } from "@/lib/whatsapp/config";
import type { RsvpStatus } from "@/lib/types";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Guests · Nidaa",
};

const validStatuses: RsvpStatus[] = ["attending", "declined", "maybe", "pending", "invalid"];

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await connection();
  await requireUser();
  const { status } = await searchParams;
  const initialStatus = validStatuses.includes(status as RsvpStatus) ? (status as RsvpStatus) : "all";
  const events = listEvents();
  const guests = listGuests();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-12 md:py-12">
      <header>
        <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.025em] md:text-[2.5rem]">Everyone you&apos;ve invited</h1>
        <p className="tnum mt-2 text-base text-ink-muted md:text-lg">
          {`${plural(guests.length, "invitation")} for ${plural(
            guests.reduce((n, g) => n + g.seats, 0),
            "person",
            "people"
          )}, across ${plural(events.length, "event")}.`}
        </p>
      </header>

      <div className="mt-10">
        <GuestExplorer
          guests={guests}
          events={Object.fromEntries(events.map((e) => [e.id, { name: e.name }]))}
          showEvent
          initialStatus={initialStatus}
          simulation={!isWhatsAppConfigured()}
        />
      </div>
    </main>
  );
}
