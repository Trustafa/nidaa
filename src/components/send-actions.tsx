"use client";

import { useState, useTransition } from "react";
import { sendChasersAction, sendInvitationsAction, type SendResult } from "@/app/actions";
import { renderTemplate } from "@/lib/copy";
import { TEMPLATES } from "@/lib/whatsapp/templates";
import { fmtWhen, plural } from "@/lib/format";
import type { EventSummary, MediaKind } from "@/lib/types";
import { Modal } from "./modal";
import { WhatsAppPreview } from "./whatsapp-preview";
import { useToast } from "./toast";
import { Spinner, btnPrimary, btnSecondary } from "./ui";

type Mode = "invite" | "chase";

/** WhatsApp's daily allowance, as the server sees it right now */
export type QuotaInfo = { limit: number | null; remaining: number | null; nextSlotAt: string | null };

export function SendActions({
  event,
  media,
  quota,
  simulation,
}: {
  event: EventSummary;
  /** The invitation's photo or video, if one is attached */
  media: { kind: MediaKind; url: string } | null;
  quota: QuotaInfo;
  simulation: boolean;
}) {
  const [open, setOpen] = useState<Mode | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const toInvite = event.notInvited - event.queuedInvitations;
  const toRemind = event.pending + event.invalid - event.notInvited - event.queuedReminders;
  const count = open === "chase" ? toRemind : toInvite;
  const templateKey = open === "chase" ? "chase" : "invitation";
  const noun = open === "chase" ? "reminder" : "invitation";

  // How the batch splits under the daily limit (an estimate: someone already
  // messaged today doesn't use a second slot, so a few more may go now)
  const nowCount = quota.remaining === null ? count : Math.min(count, quota.remaining);
  const laterCount = count - nowCount;
  const resumes = quota.nextSlotAt ? fmtWhen(quota.nextSlotAt) : "about this time tomorrow";

  function confirm() {
    if (!open) return;
    startTransition(async () => {
      const action = open === "chase" ? sendChasersAction : sendInvitationsAction;
      const r: SendResult = await action(event.id);
      setOpen(null);
      const queuedNote = r.queued
        ? ` ${plural(r.queued, noun)} queued; ${r.queued === 1 ? "it goes" : "they go"} out automatically from ${r.nextSlotAt ? fmtWhen(r.nextSlotAt) : "about this time tomorrow"}.`
        : "";
      if (r.failed && !r.sent) toast(`None of the ${noun}s could be sent. Open a guest to see why.${queuedNote}`, "error");
      else if (r.failed)
        toast(`${plural(r.sent, noun)} sent. ${r.failed} couldn't be delivered — they're marked in the guest list.${queuedNote}`, "error");
      else if (!r.sent && r.queued) toast(`Today's WhatsApp limit is used up.${queuedNote}`);
      else
        toast(
          (r.simulated ? `${plural(r.sent, noun)} written down (practice run).` : `${plural(r.sent, noun)} on their way.`) + queuedNote
        );
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {toRemind > 0 && (
          <button type="button" onClick={() => setOpen("chase")} className={`tnum ${toInvite > 0 ? btnSecondary : btnPrimary}`}>
            {`Remind the ${toRemind} without a clear answer`}
          </button>
        )}
        {toInvite > 0 && (
          <button type="button" onClick={() => setOpen("invite")} className={`tnum ${btnPrimary}`}>
            {`Send ${plural(toInvite, "invitation")}`}
          </button>
        )}
      </div>

      {open && (
        <Modal
          title={open === "chase" ? `Remind ${plural(count, "family", "families")}?` : `Send ${plural(count, "invitation")}?`}
          description={
            open === "chase"
              ? "Everyone who hasn't replied yet, or whose reply Nidaa couldn't read, gets this gentle reminder on WhatsApp."
              : "Each goes to the head of a family on WhatsApp, with their first name and how many people the invitation is for. You can't unsend it."
          }
          onClose={() => !pending && setOpen(null)}
        >
          <WhatsAppPreview
            media={open === "invite" ? media : null}
            text={renderTemplate(templateKey, { name: "Ayesha Khan", partySize: 0, seats: event.maxPartySize }, event)}
            buttons={TEMPLATES[templateKey].buttons.map((b) => b.text)}
          />
          {laterCount > 0 && (
            <div className="mt-4 rounded-md bg-surface px-3 py-2.5 text-sm leading-5">
              <p className="font-semibold">
                {nowCount > 0 ? `${nowCount} go now, ${laterCount} go later` : `All ${laterCount} go later`}
              </p>
              <p className="mt-0.5 text-ink-muted">
                {`WhatsApp lets you start conversations with ${quota.limit} people a day until your business is verified. `}
                {`The rest wait in a queue and go out automatically from ${resumes}. You don't need to do anything.`}
              </p>
            </div>
          )}
          {simulation && (
            <p className="mt-4 rounded-md bg-maybe-bg px-3 py-2.5 text-sm leading-5 text-maybe-ink">
              WhatsApp isn&apos;t connected yet, so this is a practice run: each message is written into the
              guest&apos;s history, but nobody receives it.
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setOpen(null)} disabled={pending} className={btnSecondary}>
              Cancel
            </button>
            <button type="button" onClick={confirm} disabled={pending} className={`tnum ${btnPrimary}`}>
              {pending && <Spinner />}
              {pending
                ? "Sending…"
                : laterCount === 0
                  ? `Send ${plural(count, noun)}`
                  : nowCount === 0
                    ? `Queue ${plural(count, noun)}`
                    : `Send ${nowCount} now, queue ${laterCount}`}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
