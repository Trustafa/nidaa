"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { StatusBadge } from "./status-badge";
import { CloseIcon } from "./icons";
import { useToast } from "./toast";
import { Field, Spinner, btnDanger, btnPrimary, btnSecondary, inputBase } from "./ui";
import {
  deleteGuestAction,
  resendInvitationAction,
  simulateReplyAction,
  updateGuestAction,
  type FormState,
} from "@/app/actions";
import { fmtTime } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { statusLabels, type DeliveryStatus, type Guest, type Message, type RsvpStatus } from "@/lib/types";

export type EventInfo = { name: string };

type Props = {
  guest: Guest;
  event: EventInfo;
  simulation: boolean;
  onClose: () => void;
};

const deliveryLabel: Record<DeliveryStatus, string> = {
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Not delivered",
};

const awaitingLabel = { rsvp: "Waiting for their reply", party_size: "Waiting for party size" } as const;

export function GuestDrawer({ guest, event, simulation, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLLIElement>(null);
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // Let open dialogs and inputs handle their own Escape first
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Keep the newest message in view as replies arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [guest.timeline.length]);

  function resend() {
    startTransition(async () => {
      const r = await resendInvitationAction(guest.id);
      toast(r.message, r.ok ? "success" : "error");
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteGuestAction(guest.id);
      toast(`${guest.name} removed from the guest list.`);
      onClose();
    });
  }

  return (
    <>
      <div aria-hidden onClick={onClose} className="fixed inset-0 z-[var(--z-drawer-backdrop)] bg-cover-deep/40 animate-[fade-in_150ms_ease-out]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Guest details for ${guest.name}`}
        className="fixed inset-y-0 right-0 z-[var(--z-drawer)] flex w-full max-w-md flex-col bg-bg shadow-[-12px_0_32px_-12px_oklch(0.25_0.08_262/0.35)] animate-[drawer-in_220ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <header className="border-b border-ink/80 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-[-0.015em]">{guest.name}</h2>
              <p className="tnum mt-0.5 text-[0.9375rem] text-ink-muted">{formatPhone(guest.phone)}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close guest details"
              className="-mr-2 flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-ink-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
            >
              <CloseIcon className="size-3.5" />
              Close
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1.5 text-[0.9375rem]">
            <dt className="text-ink-muted">Reply</dt>
            <dd>
              <StatusBadge status={guest.status} />
              {guest.awaiting && <span className="ml-2 text-sm text-ink-muted">{`· ${awaitingLabel[guest.awaiting]}`}</span>}
            </dd>
            <dt className="text-ink-muted">Family</dt>
            <dd>
              {guest.status === "attending" ? (
                <span className="font-hand text-xl leading-none font-bold text-brand-600">{guest.partySize}</span>
              ) : (
                <span className="text-ink-faint">—</span>
              )}
              <span className="text-ink-muted">{` of ${guest.seats} coming`}</span>
            </dd>
            <dt className="text-ink-muted">Event</dt>
            <dd className="font-semibold">{event.name}</dd>
          </dl>
        </header>

        {editing ? (
          <EditGuestForm guest={guest} onDone={() => setEditing(false)} />
        ) : (
          <>
            <div className="chat-surface flex-1 overflow-y-auto px-5 py-5">
              <h3 className="text-sm font-semibold text-ink-muted">On WhatsApp</h3>
              {guest.timeline.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  No messages yet. {guest.name.split(" ")[0]} will get an invitation the next time you send invitations for this event.
                </p>
              ) : (
                <ol className="mt-3 flex flex-col gap-2.5">
                  {guest.timeline.map((entry) => (
                    <TimelineItem key={entry.id} entry={entry} />
                  ))}
                  <li ref={endRef} aria-hidden />
                </ol>
              )}
            </div>

            {simulation && guest.invitedAt && (
              <SimulateReply
                guestId={guest.id}
                partySizes={guest.awaiting === "party_size" ? guest.seats : 0}
              />
            )}

            <footer className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
              {confirmRemove ? (
                <>
                  <p className="mr-auto text-sm">{`Remove ${guest.name.split(" ")[0]}?`}</p>
                  <button type="button" onClick={() => setConfirmRemove(false)} disabled={pending} className={btnSecondary}>
                    Keep
                  </button>
                  <button type="button" onClick={remove} disabled={pending} className={`${btnDanger} border border-declined-dot/40`}>
                    {pending && <Spinner />}
                    Remove guest
                  </button>
                </>
              ) : (
                <>
                  {guest.optedOutAt ? (
                    <p className="text-sm text-ink-muted">Replied STOP. Nidaa won&apos;t message them unless they reply again.</p>
                  ) : (
                    <button type="button" onClick={resend} disabled={pending} className={btnPrimary}>
                      {pending && <Spinner />}
                      {guest.invitedAt ? "Resend invitation" : "Send invitation"}
                    </button>
                  )}
                  <button type="button" onClick={() => setEditing(true)} className={btnSecondary}>
                    Edit guest
                  </button>
                  <button type="button" onClick={() => setConfirmRemove(true)} className={`ml-auto ${btnDanger}`}>
                    Remove
                  </button>
                </>
              )}
            </footer>
          </>
        )}
      </div>
    </>
  );
}

function TimelineItem({ entry }: { entry: Message }) {
  const outbound = entry.from === "nidaa";
  const failed = entry.delivery === "failed";
  return (
    <li className={outbound ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-[0.9375rem] leading-[1.35] ${
          outbound
            ? `rounded-tr-sm text-ink shadow-wa ${failed ? "border border-declined-dot/50 bg-declined-bg" : "bg-wa-sent"}`
            : "rounded-tl-sm bg-bg text-ink shadow-wa"
        }`}
      >
        {entry.media && (
          <div className="-mx-2 -mt-1 mb-2">
            {entry.media.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/media/${entry.media.assetId}`} alt="Invitation photo" className="max-h-56 w-full rounded-md object-cover" />
            ) : (
              <video src={`/api/media/${entry.media.assetId}`} controls playsInline preload="metadata" className="max-h-56 w-full rounded-md bg-ink" />
            )}
          </div>
        )}
        <p className="whitespace-pre-wrap">{entry.text}</p>
        <p className="tnum mt-1 flex flex-wrap items-center justify-end gap-x-1.5 text-[0.75rem] text-ink-muted">
          <span>{fmtTime(entry.at)}</span>
          {outbound && entry.delivery && (
            <span className={failed ? "font-medium text-declined-ink" : undefined}>{`· ${deliveryLabel[entry.delivery]}`}</span>
          )}
          {entry.simulated && <span>· Practice</span>}
        </p>
        {failed && entry.error && <p className="mt-1 text-xs text-declined-ink">{entry.error}</p>}
      </div>
    </li>
  );
}

/** The options the guest sees on WhatsApp: RSVP buttons, or the party-size picker once they've said yes */
function SimulateReply({ guestId, partySizes }: { guestId: string; partySizes: number }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const reply = (t: string, payload?: string) =>
    startTransition(async () => {
      await simulateReplyAction(guestId, t, payload);
      setText("");
    });

  return (
    <section aria-label="Practice reply" className="border-t border-dashed border-line-strong bg-maybe-bg/60 px-6 py-3">
      <p className="text-sm font-semibold text-maybe-ink">
        {partySizes > 0 ? "Practice: pick how many are coming, as this guest" : "Practice: reply as this guest"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(partySizes > 0
          ? Array.from({ length: Math.min(partySizes, 10) }, (_, i) =>
              [`party:${guestId}:${i + 1}`, i === 0 ? "Just me" : i + 1 === partySizes ? `All ${i + 1} of us` : `${i + 1} people`] as const
            )
          : ([
              [`rsvp:${guestId}:attending`, "Attending"],
              [`rsvp:${guestId}:declined`, "Can't make it"],
              [`rsvp:${guestId}:maybe`, "Maybe"],
            ] as const)
        ).map(([payload, label]) => (
          <button
            key={payload}
            type="button"
            disabled={pending}
            onClick={() => reply(label, payload)}
            className="rounded-md border border-control bg-bg px-2.5 py-1 text-sm font-semibold text-ink transition-colors duration-150 hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
          >
            {label}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) reply(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type what they'd write, e.g. 3"
          aria-label="Practice reply text"
          className={`py-1.5 ${inputBase}`}
        />
        <button type="submit" disabled={pending || !text.trim()} className={`py-1.5 ${btnSecondary}`}>
          Send
        </button>
      </form>
    </section>
  );
}

function EditGuestForm({ guest, onDone }: { guest: Guest; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateGuestAction.bind(null, guest.id), {});
  const [status, setStatus] = useState<RsvpStatus>(guest.status);
  const [seats, setSeats] = useState(guest.seats);
  const toast = useToast();
  const err = state.errors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "Guest updated.");
      onDone();
    }
  }, [state, toast, onDone]);

  return (
    <form action={formAction} className="flex flex-1 flex-col overflow-y-auto" noValidate>
      <div className="flex flex-col gap-4 px-6 py-5">
        <Field label="Name" htmlFor="edit-name" error={err.name}>
          <input id="edit-name" name="name" defaultValue={guest.name} aria-invalid={Boolean(err.name)} className={inputBase} />
        </Field>
        <Field label="WhatsApp number" htmlFor="edit-phone" error={err.phone}>
          <input id="edit-phone" name="phone" type="tel" defaultValue={formatPhone(guest.phone)} aria-invalid={Boolean(err.phone)} className={`tnum ${inputBase}`} />
        </Field>
        <Field label="RSVP" htmlFor="edit-status" error={err.status} hint="Change this when a guest tells you their answer some other way.">
          <select
            id="edit-status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RsvpStatus)}
            className={inputBase}
          >
            {(Object.keys(statusLabels) as RsvpStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="People on this invitation"
          htmlFor="edit-seats"
          error={err.seats}
          hint="The whole household this invitation covers, including them."
        >
          <input
            id="edit-seats"
            name="seats"
            type="number"
            min={1}
            max={20}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            aria-invalid={Boolean(err.seats)}
            className={`tnum w-24 ${inputBase}`}
          />
        </Field>
        {status === "attending" && (
          <Field label="How many are coming" htmlFor="edit-party" error={err.partySize} hint={`Up to ${seats || guest.seats}, including them.`}>
            <input
              id="edit-party"
              name="partySize"
              type="number"
              min={1}
              max={seats || guest.seats}
              defaultValue={Math.max(guest.partySize, 1)}
              aria-invalid={Boolean(err.partySize)}
              className={`tnum w-24 ${inputBase}`}
            />
          </Field>
        )}
        {state.message && !state.ok && <p role="alert" className="text-sm text-declined-ink">{state.message}</p>}
      </div>
      <div className="mt-auto flex gap-2 border-t border-line px-6 py-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Spinner />}
          Save guest
        </button>
        <button type="button" onClick={onDone} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
