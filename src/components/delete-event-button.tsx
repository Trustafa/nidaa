"use client";

import { useState, useTransition } from "react";
import { deleteEventAction } from "@/app/actions";
import { plural } from "@/lib/format";
import { Modal } from "./modal";
import { Spinner, btnDanger, btnSecondary, inputBase } from "./ui";

export function DeleteEventButton({ eventId, eventName, guestCount }: { eventId: string; eventName: string; guestCount: number }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = typed.trim() === eventName;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${btnDanger} border border-declined-dot/40`}>
        Delete event
      </button>
      {open && (
        <Modal
          title={`Delete “${eventName}”?`}
          description={`This permanently removes ${plural(guestCount, "guest")} and their WhatsApp history from Nidaa.`}
          onClose={() => !pending && setOpen(false)}
        >
          <label htmlFor="confirm-name" className="block text-sm">
            Type the event name to confirm
          </label>
          <input
            id="confirm-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className={`mt-1.5 ${inputBase}`}
          />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} disabled={pending} className={btnSecondary}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!matches || pending}
              onClick={() => startTransition(() => deleteEventAction(eventId))}
              className={`${btnDanger} border border-declined-dot/40`}
            >
              {pending && <Spinner />}
              Delete event
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
