"use server";

/**
 * Server actions for the dashboard. These are reachable by direct POST, so
 * each one checks the session first (requireUser). There's one organization,
 * so any signed-in user may act on any event.
 *
 * Changes are saved to the database before the page refreshes (saved()), so
 * a database problem shows up as an error instead of a silent loss.
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import * as store from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { flush } from "@/lib/persist";
import { readMedia } from "@/lib/media";
import { normalizePhone } from "@/lib/phone";
import { todayIso } from "@/lib/format";
import { sendingQuota } from "@/lib/quota";
import type { Event, RsvpStatus } from "@/lib/types";
import {
  handleInbound,
  runScheduledReminders,
  sendChasers,
  sendInvitation,
  sendInvitations,
  describeWhatsAppError,
} from "@/lib/rsvp";
import { getWhatsAppConfig, isWhatsAppConfigured } from "@/lib/whatsapp/config";
import { createTemplate, listTemplates, sendMessage, subscribeApp, uploadTemplateSample, WhatsAppError } from "@/lib/whatsapp/client";
import { TEMPLATES, templateCreationRequest } from "@/lib/whatsapp/templates";
import { waId } from "@/lib/phone";

/** Write pending changes to the database, then re-render the page */
async function saved() {
  await flush();
  refresh();
}

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

/** WhatsApp rejects template parameters containing newlines, tabs or runs of spaces */
function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function int(value: FormDataEntryValue | null, fallback: number) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

const oneOf = (n: number, allowed: number[], fallback: number) => (allowed.includes(n) ? n : fallback);

/** People one invitation covers (a household); null when missing or not a sensible number */
const MAX_SEATS = 20;
function seatsFrom(value: unknown): number | null {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) && n >= 1 && n <= MAX_SEATS ? n : null;
}

function whatsAppMessage(e: unknown) {
  return e instanceof WhatsAppError ? describeWhatsAppError(e.code, e.message) : String(e);
}

/* ── Events ───────────────────────────────────────────────────────────── */

export async function saveEvent(eventId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const input: Omit<Event, "id" | "createdAt"> = {
    name: clean(formData.get("name"), 80),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    venue: clean(formData.get("venue"), 120),
    hostedBy: clean(formData.get("hostedBy"), 120),
    dateNote: clean(formData.get("dateNote"), 120),
    maxPartySize: Math.min(Math.max(int(formData.get("maxPartySize"), 2), 1), MAX_SEATS),
    reminders: {
      chaseEveryDays: oneOf(int(formData.get("chaseEveryDays"), 3), [0, 2, 3, 5, 7], 3),
      maxChases: Math.min(Math.max(int(formData.get("maxChases"), 2), 1), 3),
      daysBeforeEvent: oneOf(int(formData.get("daysBeforeEvent"), 2), [0, 1, 2, 3, 7], 2),
    },
    media: null,
  };
  const mediaId = String(formData.get("mediaId") ?? "");
  if (mediaId) {
    const asset = store.getMedia(mediaId);
    if (asset) input.media = asset;
  }

  const errors: Record<string, string> = {};
  if (!input.name) errors.name = "Give the event a name guests will recognize.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = "Pick the event date.";
  else if (!eventId && input.date < todayIso()) errors.date = "The date has already passed.";
  if (!/^\d{2}:\d{2}$/.test(input.time)) errors.time = "Pick a start time.";
  if (!input.hostedBy) errors.hostedBy = "Add who the invitation is from.";
  if (!input.venue) errors.venue = "Add the venue so guests know where to go.";
  if (mediaId && !input.media) errors.media = "That photo or video is no longer available. Upload it again.";
  if (Object.keys(errors).length) return { ok: false, errors };

  let id = eventId;
  if (id) {
    if (!store.updateEvent(id, input)) return { ok: false, message: "This event no longer exists." };
  } else {
    id = store.createEvent(input).id;
  }
  await flush();
  redirect(`/events/${id}`);
}

export async function deleteEventAction(eventId: string) {
  await requireUser();
  store.deleteEvent(eventId);
  await flush();
  redirect("/events");
}

/* ── Guests ───────────────────────────────────────────────────────────── */

export async function addGuestAction(eventId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const name = clean(formData.get("name"), 80);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const seats = seatsFrom(formData.get("seats"));
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter the guest's name.";
  if (!seats) errors.seats = `Enter how many people this invitation is for, from 1 to ${MAX_SEATS}.`;
  if (!phone) errors.phone = "Enter a mobile number with country code, e.g. +971 50 123 4567.";
  else if (store.phoneTaken(eventId, phone)) errors.phone = "This number is already on the guest list.";
  if (formData.get("consent") !== "on") errors.consent = "Confirm the guest agreed to hear from you on WhatsApp.";
  if (Object.keys(errors).length) return { ok: false, errors };

  store.addGuests(eventId, [{ name, phone: phone!, seats: seats! }]);
  await saved();
  return { ok: true, message: `${name} added to the guest list.` };
}

export type ImportResult = { added: number; duplicates: number; invalid: number };

export async function importGuestsAction(
  eventId: string,
  rows: { name: string; phone: string; seats?: string }[],
  defaultCountryCode: string
): Promise<ImportResult> {
  await requireUser();
  const valid: { name: string; phone: string; seats?: number }[] = [];
  let invalid = 0;
  const cc = defaultCountryCode.replace(/\D/g, "") || undefined;
  for (const row of rows.slice(0, 5000)) {
    const name = clean(row.name, 80);
    const phone = normalizePhone(row.phone, cc);
    // A blank seats cell falls back to the event's default
    const seats = row.seats?.trim() ? seatsFrom(row.seats) : undefined;
    if (name && phone && seats !== null) valid.push({ name, phone, seats });
    else invalid++;
  }
  const { added, duplicates } = store.addGuests(eventId, valid);
  await saved();
  return { added: added.length, duplicates: duplicates.length, invalid };
}

export async function updateGuestAction(guestId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const guest = store.getGuest(guestId);
  const event = guest && store.getEvent(guest.eventId);
  if (!guest || !event) return { ok: false, message: "This guest no longer exists." };

  const name = clean(formData.get("name"), 80);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const status = String(formData.get("status")) as RsvpStatus;
  const partySize = int(formData.get("partySize"), 0);
  const seats = seatsFrom(formData.get("seats"));

  const errors: Record<string, string> = {};
  if (!seats) errors.seats = `Enter how many people this invitation is for, from 1 to ${MAX_SEATS}.`;
  if (!name) errors.name = "Enter the guest's name.";
  if (!phone) errors.phone = "Enter a mobile number with country code.";
  else if (store.phoneTaken(guest.eventId, phone, guest.id)) errors.phone = "Another guest on this list has this number.";
  if (!["attending", "declined", "maybe", "pending", "invalid"].includes(status)) errors.status = "Choose an RSVP.";
  if (seats !== null && status === "attending" && (partySize < 1 || partySize > seats))
    errors.partySize = `Coming must be between 1 and ${seats}, the size of this invitation.`;
  if (Object.keys(errors).length) return { ok: false, errors };

  const statusChanged = status !== guest.status;
  store.updateGuest(guestId, {
    name,
    phone: phone!,
    status,
    seats: seats!,
    partySize: status === "attending" ? partySize : 0,
    // A manual answer settles the conversation
    awaiting: statusChanged && status !== "pending" ? null : guest.awaiting,
    updatedAt: statusChanged ? new Date().toISOString() : guest.updatedAt,
  });
  await saved();
  return { ok: true, message: "Guest updated." };
}

export async function deleteGuestAction(guestId: string) {
  await requireUser();
  store.deleteGuest(guestId);
  await saved();
}

/* ── Sending ──────────────────────────────────────────────────────────── */

export type SendResult = {
  sent: number;
  failed: number;
  /** Past today's WhatsApp limit; sent automatically as room frees up */
  queued: number;
  /** When the queue starts moving again, if today's room is used up */
  nextSlotAt: string | null;
  simulated: boolean;
};

export async function sendInvitationsAction(eventId: string): Promise<SendResult> {
  await requireUser();
  const result = await sendInvitations(eventId);
  await saved();
  return { ...result, nextSlotAt: sendingQuota().nextSlotAt, simulated: !isWhatsAppConfigured() };
}

export async function sendChasersAction(eventId: string): Promise<SendResult> {
  await requireUser();
  const result = await sendChasers(eventId);
  await saved();
  return { ...result, nextSlotAt: sendingQuota().nextSlotAt, simulated: !isWhatsAppConfigured() };
}

export async function resendInvitationAction(guestId: string): Promise<{ ok: boolean; message: string }> {
  await requireUser();
  if (store.getGuest(guestId)?.optedOutAt) {
    return { ok: false, message: "This guest replied STOP, so Nidaa won't message them unless they reply again." };
  }
  const r = await sendInvitation(guestId);
  await saved();
  if (r.queued) {
    return { ok: true, message: "Today's WhatsApp limit is used up, so this invitation is queued. It goes out automatically as soon as there's room." };
  }
  const m = r.message;
  return m.delivery === "failed"
    ? { ok: false, message: m.error ?? "The invitation couldn't be sent." }
    : { ok: true, message: m.simulated ? "Invitation written down (practice run)." : "Invitation on its way." };
}

/**
 * Plays a guest's reply through the same code path as the real webhook.
 * Only available while WhatsApp isn't connected.
 */
export async function simulateReplyAction(guestId: string, text: string, payload?: string) {
  await requireUser();
  if (isWhatsAppConfigured()) throw new Error("Simulation is disabled while WhatsApp is connected.");
  const guest = store.getGuest(guestId);
  if (!guest || !text.trim()) return;
  await handleInbound({
    wamid: `sim.in.${Date.now()}`,
    from: waId(guest.phone),
    at: new Date().toISOString(),
    text: text.trim().slice(0, 500),
    payload,
  });
  await saved();
}

/* ── Settings ─────────────────────────────────────────────────────────── */

export async function updateOrgAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const name = clean(formData.get("name"), 80);
  const organizerName = clean(formData.get("organizerName"), 60);
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter your organization's name.";
  if (!organizerName) errors.organizerName = "Enter your name.";
  if (Object.keys(errors).length) return { ok: false, errors };
  store.updateOrg({ name, organizerName });
  await saved();
  return { ok: true, message: "Saved." };
}

/** Sends Meta's pre-approved `hello_world` template — proves token, number and recipient work */
export async function sendTestMessageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  if (!isWhatsAppConfigured()) return { ok: false, message: "Connect WhatsApp first." };
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { ok: false, errors: { phone: "Enter a mobile number with country code." } };
  try {
    await sendMessage({
      messaging_product: "whatsapp",
      to: waId(phone),
      type: "template",
      template: { name: "hello_world", language: { code: "en_US" } },
    });
    return { ok: true, message: `Test message sent to ${phone}. Check WhatsApp on that phone.` };
  } catch (e) {
    return { ok: false, message: whatsAppMessage(e) };
  }
}

export async function submitTemplatesAction(): Promise<{ ok: boolean; message: string }> {
  await requireUser();
  const { businessAccountId, templateLanguage } = getWhatsAppConfig();
  if (!isWhatsAppConfigured() || !businessAccountId) {
    return { ok: false, message: "Set WHATSAPP_BUSINESS_ACCOUNT_ID and the access token first." };
  }
  try {
    const existing = new Set((await listTemplates()).map((t) => `${t.name}:${t.language}`));
    const missing = Object.values(TEMPLATES).filter((t) => !existing.has(`${t.name}:${templateLanguage}`));
    let submitted = 0;
    const waiting: string[] = [];
    for (const t of missing) {
      let handle: string | undefined;
      if (t.header) {
        // Meta reviews media templates with a real sample: use the latest upload of that kind
        const sample = store.latestMedia(t.header === "IMAGE" ? "image" : "video");
        if (!sample) {
          waiting.push(t.header === "IMAGE" ? "photo" : "video");
          continue;
        }
        const bytes = await readMedia(sample);
        handle = await uploadTemplateSample(new Blob([bytes], { type: sample.mimeType }), sample.mimeType, sample.fileName);
      }
      await createTemplate(templateCreationRequest(t, templateLanguage, handle));
      submitted++;
    }
    await saved();
    const note = waiting.length
      ? ` The ${waiting.join(" and ")} invitation ${waiting.length === 1 ? "needs" : "need"} a sample: attach a ${waiting.join(" or ")} to any event, then submit again.`
      : "";
    return {
      ok: submitted > 0 || waiting.length === 0,
      message: submitted
        ? `Submitted ${submitted} template${submitted === 1 ? "" : "s"} for review. Approval usually takes minutes, sometimes up to a day.${note}`
        : waiting.length
          ? note.trim()
          : "All templates are already submitted.",
    };
  } catch (e) {
    return { ok: false, message: whatsAppMessage(e) };
  }
}

export async function subscribeAppAction(): Promise<{ ok: boolean; message: string }> {
  await requireUser();
  try {
    await subscribeApp();
    await saved();
    return { ok: true, message: "Your app now receives this WhatsApp account's webhooks." };
  } catch (e) {
    return { ok: false, message: whatsAppMessage(e) };
  }
}

export async function runRemindersAction(): Promise<{ ok: boolean; message: string }> {
  await requireUser();
  const { chased, reminded, dequeued, stillQueued } = await runScheduledReminders();
  await saved();
  const parts = [
    dequeued && `${dequeued} queued message${dequeued === 1 ? "" : "s"}`,
    chased && `${chased} reminder${chased === 1 ? "" : "s"} to guests who haven't replied`,
    reminded && `${reminded} before-the-day reminder${reminded === 1 ? "" : "s"}`,
  ].filter(Boolean);
  const waiting = stillQueued ? ` ${stillQueued} still waiting for room under today's WhatsApp limit.` : "";
  return {
    ok: true,
    message: parts.length ? `Sent ${parts.join(", ")}.${waiting}` : `Nothing is due right now.${waiting}`,
  };
}
