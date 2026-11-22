"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveEvent, type FormState } from "@/app/actions";
import { renderTemplate } from "@/lib/copy";
import { TEMPLATES } from "@/lib/whatsapp/templates";
import type { Event } from "@/lib/types";
import { WhatsAppPreview } from "./whatsapp-preview";
import { MediaPicker, type PublicMedia } from "./media-picker";
import { Field, Spinner, btnPrimary, btnSecondary, inputBase } from "./ui";

type Props = {
  event?: Event;
  /** The invitation's current photo or video, without server-only fields */
  initialMedia?: PublicMedia | null;
  /** Earliest selectable date for new events */
  minDate: string;
};

const select = `${inputBase} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23777' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")] bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat pr-9`;

export function EventForm({ event, initialMedia = null, minDate }: Props) {
  const [media, setMedia] = useState<PublicMedia | null>(initialMedia);
  const [defaultSeats, setDefaultSeats] = useState(event?.maxPartySize ?? 2);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveEvent.bind(null, event?.id ?? null),
    {}
  );
  const [values, setValues] = useState({
    name: event?.name ?? "",
    date: event?.date ?? "",
    time: event?.time ?? "19:00",
    venue: event?.venue ?? "",
    hostedBy: event?.hostedBy ?? "",
    dateNote: event?.dateNote ?? "",
  });
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));
  const err = state.errors ?? {};

  const previewEvent: Event = {
    id: "preview",
    createdAt: "",
    maxPartySize: 2,
    reminders: { chaseEveryDays: 3, maxChases: 2, daysBeforeEvent: 2 },
    media: null,
    name: values.name || "your event",
    date: values.date || minDate,
    time: values.time || "19:00",
    venue: values.venue || "the venue",
    hostedBy: values.hostedBy || "the hosts",
    dateNote: values.dateNote,
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <form action={formAction} className="flex flex-col gap-8" noValidate>
        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 w-full border-b border-ink/80 pb-2 text-lg font-bold tracking-[-0.01em]">The basics</legend>
          <Field label="Event name" htmlFor="name" error={err.name} hint="Guests read “…for the” and then this, e.g. “Wedding reception of Mulla Taher bhai Lokhandwala”.">
            <input
              id="name"
              name="name"
              value={values.name}
              onChange={set("name")}
              maxLength={80}
              required
              autoComplete="off"
              aria-invalid={Boolean(err.name)}
              aria-describedby={err.name ? "name-error" : "name-hint"}
              className={`mt-0 ${inputBase}`}
            />
          </Field>
          <Field label="Invited by" htmlFor="hostedBy" error={err.hostedBy} hint="Who the invitation is from, as it should read on the card.">
            <input
              id="hostedBy"
              name="hostedBy"
              value={values.hostedBy}
              onChange={set("hostedBy")}
              maxLength={120}
              required
              autoComplete="off"
              placeholder="Mulla Hatim & Zainab Lokhandwala"
              aria-invalid={Boolean(err.hostedBy)}
              className={inputBase}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date" htmlFor="date" error={err.date}>
              <input
                id="date"
                name="date"
                type="date"
                value={values.date}
                min={event ? undefined : minDate}
                onChange={set("date")}
                required
                aria-invalid={Boolean(err.date)}
                className={`tnum ${inputBase}`}
              />
            </Field>
            <Field label="Start time" htmlFor="time" error={err.time}>
              <input
                id="time"
                name="time"
                type="time"
                value={values.time}
                onChange={set("time")}
                required
                aria-invalid={Boolean(err.time)}
                className={`tnum ${inputBase}`}
              />
            </Field>
          </div>
          <Field
            label="Note after the date (optional)"
            htmlFor="dateNote"
            hint="Shown after the date, e.g. the Hijri date or an arrival time: “12 Rabiul Akhar (Shz Saheb will arrive at 7pm)”."
          >
            <input
              id="dateNote"
              name="dateNote"
              value={values.dateNote}
              onChange={set("dateNote")}
              maxLength={120}
              autoComplete="off"
              className={inputBase}
            />
          </Field>
          <Field label="Venue" htmlFor="venue" error={err.venue}>
            <input
              id="venue"
              name="venue"
              value={values.venue}
              onChange={set("venue")}
              maxLength={120}
              required
              placeholder="Al Habtoor Palace, Dubai"
              aria-invalid={Boolean(err.venue)}
              className={inputBase}
            />
          </Field>
          <div>
            <p className="text-sm font-semibold text-ink">
              Photo or video <span className="font-normal text-ink-muted">(optional)</span>
            </p>
            <p className="mt-0.5 mb-2 text-sm text-ink-muted">Sent above the invitation text, like your printed card would be.</p>
            <MediaPicker value={media} onChange={setMedia} error={err.media} />
          </div>
          <Field
            label="Usual family size"
            htmlFor="maxPartySize"
            hint="Each invitation goes to the head of a family and covers their household. This is the default; set each family's own number when you add or import guests."
          >
            <select
              id="maxPartySize"
              name="maxPartySize"
              value={defaultSeats}
              onChange={(e) => setDefaultSeats(Number(e.target.value))}
              className={`tnum sm:max-w-48 ${select}`}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "1 person" : `${n} people`}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="sr-only">Reminders</legend>
          <div>
            <h2 className="border-b border-ink/80 pb-2 text-lg font-bold tracking-[-0.01em]">Reminders</h2>
            <p className="mt-3 text-[0.9375rem] text-ink-muted">Nidaa follows up for you, so you never have to chase anyone yourself.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Chase guests who haven't replied" htmlFor="chaseEveryDays">
              <select id="chaseEveryDays" name="chaseEveryDays" defaultValue={event?.reminders.chaseEveryDays ?? 3} className={select}>
                <option value={0}>Don&apos;t chase</option>
                <option value={2}>Every 2 days</option>
                <option value={3}>Every 3 days</option>
                <option value={5}>Every 5 days</option>
                <option value={7}>Every week</option>
              </select>
            </Field>
            <Field label="Stop after" htmlFor="maxChases">
              <select id="maxChases" name="maxChases" defaultValue={event?.reminders.maxChases ?? 2} className={select}>
                <option value={1}>1 reminder</option>
                <option value={2}>2 reminders</option>
                <option value={3}>3 reminders</option>
              </select>
            </Field>
          </div>
          <Field label="Remind attending guests before the event" htmlFor="daysBeforeEvent">
            <select
              id="daysBeforeEvent"
              name="daysBeforeEvent"
              defaultValue={event?.reminders.daysBeforeEvent ?? 2}
              className={`sm:max-w-[calc(50%-0.625rem)] ${select}`}
            >
              <option value={0}>Don&apos;t remind</option>
              <option value={1}>The day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
              <option value={7}>A week before</option>
            </select>
          </Field>
        </fieldset>

        {state.message && (
          <p role="alert" className="text-sm text-declined-ink">
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending && <Spinner />}
            {event ? "Save changes" : "Create event"}
          </button>
          <Link href={event ? `/events/${event.id}` : "/events"} className={btnSecondary}>
            Cancel
          </Link>
        </div>
      </form>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <h2 className="border-b border-ink/80 pb-2 text-lg font-bold tracking-[-0.01em]">What your guests will see</h2>
        <div className="mt-3">
          <WhatsAppPreview
            media={media}
            text={renderTemplate("invitation", { name: "Ayesha Khan", partySize: 0, seats: defaultSeats }, previewEvent)}
            buttons={TEMPLATES.invitation.buttons.map((b) => b.text)}
            caption="Each guest sees their own name and family size. Tapping a button records their reply instantly."
          />
        </div>
      </aside>
    </div>
  );
}
