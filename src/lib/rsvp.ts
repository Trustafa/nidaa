/**
 * The RSVP engine: everything Nidaa says to guests and how it reads their
 * replies. Used by server actions (sending), the WhatsApp webhook (receiving)
 * and the reminders cron. When WhatsApp isn't configured, sends are simulated:
 * they land in the guest's timeline marked as simulated and never leave Nidaa.
 */
import { readFile } from "node:fs/promises";
import type { DeliveryStatus, Event, Guest, MediaAsset, Message, MessageKind, RsvpChoice } from "./types";
import {
  appendMessage,
  claimInbound,
  findGuestsByWaId,
  findMessageByWamid,
  getEvent,
  getGuest,
  lastOutbound,
  listEvents,
  listGuests,
  updateGuest,
} from "./store";
import { replies, renderTemplate, templateParams } from "./copy";
import { daysUntil, todayIso } from "./format";
import { waId } from "./phone";
import { quotaGate } from "./quota";
import { getWhatsAppConfig, isWhatsAppConfigured } from "./whatsapp/config";
import { sendMessage, uploadMedia, WhatsAppError } from "./whatsapp/client";
import {
  TEMPLATES,
  invitationTemplateKey,
  parsePartyPayload,
  parseRsvpPayload,
  partyPayload,
  rsvpPayload,
  templateMessage,
  type TemplateKey,
} from "./whatsapp/templates";
import type { StatusUpdate } from "./whatsapp/webhook";

/* ── Errors ───────────────────────────────────────────────────────────── */

const ERROR_HINTS: Record<number, string> = {
  131026: "The number may not be on WhatsApp, or the guest hasn't accepted WhatsApp's latest terms.",
  131030: "This number isn't on the test number's allowed recipient list.",
  131047: "More than 24 hours since the guest last messaged, so only templates can be sent.",
  131049: "Meta held back this marketing message to protect the guest's inbox. Wait at least 24 hours before trying again.",
  131050: "The guest has stopped marketing messages from this business.",
  131056: "Too many messages to this guest in a short time. Try again in a minute.",
  130429: "WhatsApp's sending rate limit was reached. Try again shortly.",
  132000: "The template's parameters don't match what was approved.",
  132001: "The template isn't approved yet, or doesn't exist in this language.",
};

export function describeWhatsAppError(code: number | undefined, fallback: string) {
  const hint = code ? ERROR_HINTS[code] : undefined;
  return hint ? `${hint} (${code})` : code ? `${fallback} (${code})` : fallback;
}

/* ── Sending ──────────────────────────────────────────────────────────── */

type Outbound = {
  kind: MessageKind;
  text: string;
  media?: Message["media"];
  /** Builds the request body; may be async (e.g. to upload media first) */
  payload: (to: string) => object | Promise<object>;
};

async function deliver(guest: Guest, out: Outbound) {
  const at = new Date().toISOString();
  const base = { at, from: "nidaa" as const, text: out.text, kind: out.kind, media: out.media };
  if (!isWhatsAppConfigured()) {
    return appendMessage(guest.id, { ...base, delivery: "delivered", simulated: true, wamid: `sim.${guest.id}.${Date.now()}` });
  }
  try {
    const wamid = await sendMessage(await out.payload(waId(guest.phone)));
    return appendMessage(guest.id, { ...base, delivery: "sent", wamid });
  } catch (e) {
    const err = e instanceof WhatsAppError ? e : new WhatsAppError(String(e));
    return appendMessage(guest.id, { ...base, delivery: "failed", error: describeWhatsAppError(err.code, err.message) });
  }
}

const MEDIA_ID_TTL_MS = 29 * 86_400_000; // WhatsApp keeps uploaded media ~30 days

/**
 * Upload the event's photo/video to WhatsApp once and reuse the media id for
 * every guest. Concurrent sends share one in-flight upload.
 */
const pendingUploads = new Map<string, Promise<string>>();
async function ensureWhatsAppMedia(asset: MediaAsset): Promise<string> {
  if (asset.wa && Date.now() - new Date(asset.wa.uploadedAt).getTime() < MEDIA_ID_TTL_MS) return asset.wa.id;
  let pending = pendingUploads.get(asset.id);
  if (!pending) {
    pending = (async () => {
      const bytes = await readFile(asset.path);
      const id = await uploadMedia(new Blob([bytes], { type: asset.mimeType }), asset.mimeType, asset.fileName);
      asset.wa = { id, uploadedAt: new Date().toISOString() };
      return id;
    })().finally(() => pendingUploads.delete(asset.id));
    pendingUploads.set(asset.id, pending);
  }
  return pending;
}

function sendTemplate(guest: Guest, event: Event, key: TemplateKey, kind: MessageKind) {
  const template = TEMPLATES[key];
  const params = templateParams(key, guest, event);
  const { templateLanguage } = getWhatsAppConfig();
  const media = template.header ? event.media ?? null : null;
  return deliver(guest, {
    kind,
    text: renderTemplate(key, guest, event),
    media: media ? { kind: media.kind, assetId: media.id } : undefined,
    payload: async (to) =>
      templateMessage(to, template, params, guest.id, templateLanguage, media ? await ensureWhatsAppMedia(media) : undefined),
  });
}

/** Free-form text — only valid inside the 24h window after the guest's last message */
function sendText(guest: Guest, text: string) {
  return deliver(guest, {
    kind: "reply",
    text,
    payload: (to) => ({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
}

/** Interactive reply buttons — same 24h rule; max 3 buttons, 20-char titles */
function sendRsvpButtons(guest: Guest, text: string) {
  const buttons: [RsvpChoice, string][] = [
    ["attending", "Attending"],
    ["declined", "Can't make it"],
    ["maybe", "Maybe"],
  ];
  return deliver(guest, {
    kind: "reply",
    text,
    payload: (to) => ({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: {
          buttons: buttons.map(([choice, title]) => ({ type: "reply", reply: { id: rsvpPayload(guest.id, choice), title } })),
        },
      },
    }),
  });
}

/**
 * "How many?" as a tap: reply buttons when the choice fits in three, a list
 * (up to 10 rows) otherwise. Typed numbers are still accepted.
 */
function sendPartySizePicker(guest: Guest, max: number) {
  const text = replies.askPartySize(max);
  const sizes = Array.from({ length: Math.min(max, 10) }, (_, i) => i + 1);
  const label = (n: number) => (n === 1 ? "Just me" : n === max ? `All ${n} of us` : `${n} people`);
  return deliver(guest, {
    kind: "reply",
    text,
    payload: (to) => ({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive:
        sizes.length <= 3
          ? {
              type: "button",
              body: { text },
              action: {
                buttons: sizes.map((n) => ({ type: "reply", reply: { id: partyPayload(guest.id, n), title: label(n) } })),
              },
            }
          : {
              type: "list",
              body: { text },
              action: {
                button: replies.partySizeButton,
                sections: [
                  {
                    title: "Party size",
                    rows: sizes.map((n) => ({ id: partyPayload(guest.id, n), title: label(n) })),
                  },
                ],
              },
            },
    }),
  });
}

/** Sends regardless of the daily limit — callers check the quota first */
async function sendInvitationNow(guest: Guest, event: Event) {
  const message = await sendTemplate(guest, event, invitationTemplateKey(event.media?.kind), "invitation");
  if (message.delivery !== "failed") {
    updateGuest(guest.id, {
      invitedAt: guest.invitedAt ?? message.at,
      awaiting: guest.status === "pending" || guest.status === "invalid" ? "rsvp" : guest.awaiting,
      queued: null,
    });
  }
  return message;
}

async function sendChaseNow(guest: Guest, event: Event) {
  const m = await sendTemplate(guest, event, "chase", "chase");
  if (m.delivery !== "failed") updateGuest(guest.id, { chases: guest.chases + 1, awaiting: "rsvp", queued: null });
  return m;
}

function queue(guest: Guest, kind: "invitation" | "chase") {
  updateGuest(guest.id, { queued: { kind, since: new Date().toISOString() } });
}

/** One guest (e.g. "Resend invitation"): sends now, or queues it when today's limit is used up */
export async function sendInvitation(guestId: string): Promise<{ queued: true } | { queued: false; message: Message }> {
  const guest = getGuest(guestId);
  const event = guest && getEvent(guest.eventId);
  if (!guest || !event) throw new Error("Guest not found");
  if (!quotaGate()(guest.phone)) {
    queue(guest, "invitation");
    return { queued: true };
  }
  return { queued: false, message: await sendInvitationNow(guest, event) };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function tally(messages: { delivery?: DeliveryStatus }[], queued = 0) {
  const failed = messages.filter((m) => m.delivery === "failed").length;
  return { sent: messages.length - failed, failed, queued };
}

/** Split a batch into what fits today's limit and what has to wait */
function splitByQuota(guests: Guest[], gate = quotaGate()) {
  const now: Guest[] = [];
  const later: Guest[] = [];
  for (const g of guests) (gate(g.phone) ? now : later).push(g);
  return { now, later };
}

/**
 * Sends to every guest on the list who hasn't been invited. Anything past
 * WhatsApp's daily limit is queued and goes out automatically as room frees
 * up (runScheduledReminders). Inline for now; a large production deploy
 * should push sends onto a job queue (see docs/whatsapp-setup.md).
 */
export async function sendInvitations(eventId: string) {
  const event = getEvent(eventId);
  if (!event) throw new Error("Event not found");
  const targets = listGuests(eventId).filter((guest) => !guest.invitedAt && !guest.queued);
  const { now, later } = splitByQuota(targets);
  later.forEach((g) => queue(g, "invitation"));
  return tally(await mapLimit(now, 5, (guest) => sendInvitationNow(guest, event)), later.length);
}

function chaseTargets(eventId: string) {
  return listGuests(eventId).filter(
    (guest) => guest.invitedAt && (guest.status === "pending" || guest.status === "invalid")
  );
}

/** "Remind" from the event page: what doesn't fit today is queued */
export async function sendChasers(eventId: string) {
  const event = getEvent(eventId);
  if (!event) throw new Error("Event not found");
  const { now, later } = splitByQuota(chaseTargets(eventId).filter((guest) => !guest.queued));
  later.forEach((g) => queue(g, "chase"));
  return tally(await mapLimit(now, 5, (guest) => sendChaseNow(guest, event)), later.length);
}

/* ── Receiving ────────────────────────────────────────────────────────── */

const KEYWORDS: Record<RsvpChoice, string[]> = {
  attending: ["attending", "yes", "y", "coming", "im coming", "i will attend", "will attend", "see you there", "count me in"],
  declined: ["cant make it", "can not make it", "cannot make it", "no", "not coming", "decline", "declined", "sorry cant make it"],
  maybe: ["maybe", "not sure", "perhaps", "might"],
};

function matchChoice(text: string): RsvpChoice | null {
  const t = text.toLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
  for (const [choice, words] of Object.entries(KEYWORDS) as [RsvpChoice, string[]][]) {
    if (words.includes(t)) return choice;
  }
  return null;
}

async function applyChoice(guest: Guest, event: Event, choice: RsvpChoice, at: string) {
  switch (choice) {
    case "attending":
      if (guest.status === "attending" && guest.partySize > 0 && !guest.awaiting) {
        // Already confirmed, e.g. "See you there" on the pre-event reminder
        updateGuest(guest.id, { updatedAt: at });
        await sendText(guest, replies.stillComing);
      } else if (guest.seats <= 1) {
        updateGuest(guest.id, { status: "attending", partySize: 1, awaiting: null, updatedAt: at });
        await sendText(guest, replies.confirmed(1));
      } else {
        // Counted as one until they tell us the party size
        updateGuest(guest.id, { status: "attending", partySize: Math.max(guest.partySize, 1), awaiting: "party_size", updatedAt: at });
        await sendPartySizePicker(guest, guest.seats);
      }
      break;
    case "declined":
      updateGuest(guest.id, { status: "declined", partySize: 0, awaiting: null, updatedAt: at });
      await sendText(guest, replies.declined);
      break;
    case "maybe":
      updateGuest(guest.id, { status: "maybe", partySize: 0, awaiting: null, updatedAt: at });
      await sendText(guest, replies.maybe);
      break;
  }
}

export type Inbound = {
  wamid: string;
  /** Sender's wa_id (digits only) */
  from: string;
  at: string;
  text: string;
  /** Button payload, when the guest tapped a button */
  payload?: string;
};

/** Handle one guest message. Idempotent on wamid — Meta retries deliveries. */
export async function handleInbound(msg: Inbound) {
  if (!claimInbound(msg.wamid)) return { handled: false, reason: "duplicate" as const };

  const parsed = msg.payload ? parseRsvpPayload(msg.payload) : null;
  const party = msg.payload ? parsePartyPayload(msg.payload) : null;
  let guest = parsed ? getGuest(parsed.guestId) : party ? getGuest(party.guestId) : undefined;
  // A payload must belong to the sender's own number
  if (guest && waId(guest.phone) !== msg.from) guest = undefined;
  if (!guest) {
    const candidates = findGuestsByWaId(msg.from);
    guest = candidates.find((c) => c.awaiting) ?? candidates[0];
  }
  if (!guest) {
    console.warn(`[whatsapp] message from unknown number ${msg.from}`);
    return { handled: false, reason: "unknown_sender" as const };
  }
  const event = getEvent(guest.eventId);
  if (!event) return { handled: false, reason: "unknown_event" as const };

  appendMessage(guest.id, { at: msg.at, from: "guest", text: msg.text, kind: "reply", wamid: msg.wamid });

  const choice = parsed?.guestId === guest.id ? parsed.choice : null;
  const pickedSize = party?.guestId === guest.id ? party.size : null;
  if (choice) {
    await applyChoice(guest, event, choice, msg.at);
  } else if (pickedSize !== null || guest.awaiting === "party_size") {
    const n = /^\s*(\d{1,2})\s*$/.exec(msg.text)?.[1];
    const size = pickedSize ?? (n ? Number(n) : NaN);
    if (size >= 1 && size <= guest.seats) {
      updateGuest(guest.id, { status: "attending", partySize: size, awaiting: null, updatedAt: msg.at });
      await sendText(guest, replies.confirmed(size));
    } else {
      const typed = matchChoice(msg.text);
      if (typed && typed !== "attending") await applyChoice(guest, event, typed, msg.at);
      else await sendText(guest, replies.partySizeOutOfRange(guest.seats));
    }
  } else {
    const typed = matchChoice(msg.text);
    if (typed) {
      await applyChoice(guest, event, typed, msg.at);
    } else if (guest.awaiting === "rsvp" || guest.status === "invalid") {
      updateGuest(guest.id, { status: "invalid", updatedAt: msg.at });
      await sendRsvpButtons(guest, replies.notUnderstood);
    }
    // Otherwise the guest already answered; the note stays in the timeline for the organizer.
  }
  return { handled: true, guestId: guest.id };
}

const DELIVERY_RANK: Record<DeliveryStatus, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

/** Apply a sent/delivered/read/failed webhook to the message it refers to */
export function handleStatus(update: StatusUpdate) {
  const found = findMessageByWamid(update.id);
  if (!found) return false;
  const { message } = found;
  // Webhooks can arrive out of order; never move backwards (failed always wins)
  if (message.delivery && DELIVERY_RANK[update.status] <= DELIVERY_RANK[message.delivery]) return true;
  message.delivery = update.status;
  if (update.status === "failed") {
    const err = update.errors?.[0];
    message.error = describeWhatsAppError(err?.code, err?.message ?? err?.title ?? "Message failed to deliver");
  }
  return true;
}

/* ── Scheduled reminders ──────────────────────────────────────────────── */

/**
 * The hourly job. In order of priority, within WhatsApp's daily limit:
 *   1. queued invitations and reminders, oldest first;
 *   2. reminders to attending guests before their event (time-sensitive);
 *   3. chasers to guests who haven't replied.
 * Anything that doesn't fit simply waits for the next run. Safe to run
 * repeatedly: each guest is chased once per interval and reminded once.
 */
export async function runScheduledReminders(now = new Date()) {
  const today = todayIso(now);
  const gate = quotaGate(now);
  let chased = 0;
  let reminded = 0;
  let dequeued = 0;

  // 1. The queue
  const queued = listGuests()
    .filter((g) => g.queued)
    .sort((a, b) => a.queued!.since.localeCompare(b.queued!.since));
  for (const guest of queued) {
    const event = getEvent(guest.eventId);
    const stillNeeded =
      event &&
      daysUntil(event.date, today) >= 0 &&
      (guest.queued!.kind === "invitation" ? !guest.invitedAt : guest.status === "pending" || guest.status === "invalid");
    if (!stillNeeded) {
      updateGuest(guest.id, { queued: null });
      continue;
    }
    if (!gate(guest.phone)) break; // out of room for today; keep the order for next time
    const m = guest.queued!.kind === "invitation" ? await sendInvitationNow(guest, event) : await sendChaseNow(guest, event);
    if (m.delivery !== "failed") dequeued++;
  }

  for (const event of listEvents()) {
    const days = daysUntil(event.date, today);
    if (days < 0) continue;
    const { chaseEveryDays, maxChases, daysBeforeEvent } = event.reminders;

    // 2. Before-the-day reminders
    if (daysBeforeEvent > 0 && days <= daysBeforeEvent) {
      const due = listGuests(event.id).filter(
        (guest) => guest.status === "attending" && !guest.eventReminderSentAt && gate(guest.phone)
      );
      await mapLimit(due, 5, async (guest) => {
        const m = await sendTemplate(guest, event, "event_reminder", "event_reminder");
        if (m.delivery !== "failed") {
          updateGuest(guest.id, { eventReminderSentAt: m.at });
          reminded++;
        }
      });
    }

    // 3. Chasers
    if (chaseEveryDays > 0) {
      const due = chaseTargets(event.id).filter((guest) => {
        const last = lastOutbound(guest);
        if (guest.queued || guest.chases >= maxChases || !last || last.delivery === "failed") return false;
        if (now.getTime() - new Date(last.at).getTime() < chaseEveryDays * 86_400_000) return false;
        return gate(guest.phone);
      });
      const messages = await mapLimit(due, 5, (guest) => sendChaseNow(guest, event));
      chased += messages.filter((m) => m.delivery !== "failed").length;
    }
  }
  return { chased, reminded, dequeued, stillQueued: listGuests().filter((g) => g.queued).length };
}
