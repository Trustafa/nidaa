import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EventForm } from "@/components/event-form";
import { ChevronLeft } from "@/components/icons";
import { todayIso } from "@/lib/format";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "New event · Nidaa",
};

export default async function NewEventPage() {
  await connection();
  await requireUser();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-12 md:py-12">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition-colors duration-150 hover:text-ink"
      >
        <ChevronLeft className="size-3.5" />
        Events
      </Link>
      <h1 className="mt-4 text-[2rem] leading-tight font-bold tracking-[-0.025em] md:text-[2.5rem]">A new event</h1>
      <p className="mt-2 max-w-[60ch] text-base text-ink-muted md:text-lg">Start with the basics. Your guest list comes next.</p>
      <div className="mt-10">
        <EventForm minDate={todayIso()} />
      </div>
    </main>
  );
}
