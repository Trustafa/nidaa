/**
 * Data access for the dashboard. Backed by an in-memory store for now — it
 * lives on globalThis so it survives hot reloads, and resets when the server
 * restarts. Every read and write goes through this module, so moving to
 * Postgres means reimplementing these functions and nothing else.
 *
 * Note: in-memory state only works while one long-lived Node process serves
 * both the dashboard and the WhatsApp webhook (`next dev` / `next start`).
 */
import type { Event, EventSummary, Guest, MediaAsset, Message, Organization } from "./types";
import { seed } from "./seed";
import { waId } from "./phone";

type Db = {
  org: Organization;
  events: Event[];
  guests: Guest[];
  /** Inbound wamids already handled — Meta retries webhooks, so dedupe */
  processedInbound: Set<string>;
  /** Uploaded photos/videos, attached to an event once its form is saved */
  media: Map<string, MediaAsset>;
  seatsMigrated?: boolean;
};

const g = globalThis as unknown as { __nidaaDb?: Db };

function db(): Db {
  if (!g.__nidaaDb) g.__nidaaDb = { ...seed(), processedInbound: new Set(), media: new Map() };
  // Stores created before newer fields existed (hot reload keeps globalThis)
  g.__nidaaDb.media ??= new Map();
  if (!g.__nidaaDb.seatsMigrated) {
    for (const guest of g.__nidaaDb.guests) {
      guest.seats ??= Math.max(guest.partySize, g.__nidaaDb.events.find((e) => e.id === guest.eventId)?.maxPartySize ?? 1);
    }
    g.__nidaaDb.seatsMigrated = true;
  }
  return g.__nidaaDb;
}

let idSeq = Date.now();
export function newId(prefix: string) {
  return `${prefix}${(++idSeq).toString(36)}`;
}

/* ── Organization ─────────────────────────────────────────────────────── */

export function getOrg(): Organization {
  return db().org;
}

export function updateOrg(patch: Partial<Organization>) {
  Object.assign(db().org, patch);
}

/* ── Events ───────────────────────────────────────────────────────────── */

function lastOutbound(guest: Guest) {
  for (let i = guest.timeline.length - 1; i >= 0; i--) {
    if (guest.timeline[i].from === "nidaa") return guest.timeline[i];
  }
  return undefined;
}

export function summarize(event: Event, guests: Guest[]): EventSummary {
  const s: EventSummary = {
    ...event,
    invited: guests.length,
    invitedSeats: 0,
    attending: 0,
    attendingGuests: 0,
    declined: 0,
    maybe: 0,
    pending: 0,
    invalid: 0,
    notInvited: 0,
    failed: 0,
    queuedInvitations: 0,
    queuedReminders: 0,
  };
  for (const guest of guests) {
    s.invitedSeats += guest.seats;
    if (guest.status === "attending") {
      s.attending += Math.max(guest.partySize, 1);
      s.attendingGuests++;
    } else {
      s[guest.status]++;
    }
    if (!guest.invitedAt) s.notInvited++;
    if (guest.queued?.kind === "invitation") s.queuedInvitations++;
    if (guest.queued?.kind === "chase") s.queuedReminders++;
    if (lastOutbound(guest)?.delivery === "failed") s.failed++;
  }
  return s;
}

export function listEvents(): EventSummary[] {
  const { events, guests } = db();
  return events
    .map((e) => summarize(e, guests.filter((guest) => guest.eventId === e.id)))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getEvent(id: string): Event | undefined {
  return db().events.find((e) => e.id === id);
}

export function getEventSummary(id: string): EventSummary | undefined {
  const event = getEvent(id);
  return event && summarize(event, listGuests(id));
}

export function createEvent(input: Omit<Event, "id" | "createdAt">): Event {
  const event: Event = { ...input, id: newId("e"), createdAt: new Date().toISOString() };
  db().events.push(event);
  return event;
}

export function updateEvent(id: string, patch: Partial<Omit<Event, "id" | "createdAt">>) {
  const event = getEvent(id);
  if (event) Object.assign(event, patch);
  return event;
}

export function deleteEvent(id: string) {
  const d = db();
  d.events = d.events.filter((e) => e.id !== id);
  d.guests = d.guests.filter((guest) => guest.eventId !== id);
}

/* ── Guests ───────────────────────────────────────────────────────────── */

export function listGuests(eventId?: string): Guest[] {
  const all = db().guests;
  return eventId ? all.filter((guest) => guest.eventId === eventId) : all;
}

export function getGuest(id: string): Guest | undefined {
  return db().guests.find((guest) => guest.id === id);
}

/** Adds guests, skipping phone numbers already on this event's list */
export function addGuests(eventId: string, rows: { name: string; phone: string; seats?: number }[]) {
  const defaultSeats = getEvent(eventId)?.maxPartySize ?? 1;
  const existing = new Set(listGuests(eventId).map((guest) => guest.phone));
  const added: Guest[] = [];
  const duplicates: string[] = [];
  for (const row of rows) {
    if (existing.has(row.phone)) {
      duplicates.push(row.name);
      continue;
    }
    existing.add(row.phone);
    const guest: Guest = {
      id: newId("g"),
      eventId,
      name: row.name,
      phone: row.phone,
      status: "pending",
      seats: row.seats ?? defaultSeats,
      partySize: 0,
      invitedAt: null,
      updatedAt: null,
      awaiting: null,
      chases: 0,
      eventReminderSentAt: null,
      timeline: [],
    };
    db().guests.push(guest);
    added.push(guest);
  }
  return { added, duplicates };
}

export function updateGuest(id: string, patch: Partial<Omit<Guest, "id" | "eventId" | "timeline">>) {
  const guest = getGuest(id);
  if (guest) Object.assign(guest, patch);
  return guest;
}

export function deleteGuest(id: string) {
  const d = db();
  d.guests = d.guests.filter((guest) => guest.id !== id);
}

export function phoneTaken(eventId: string, phone: string, exceptGuestId?: string) {
  return listGuests(eventId).some((guest) => guest.phone === phone && guest.id !== exceptGuestId);
}

/* ── Media ──────────────────────────────────────────────────────────── */

export function addMedia(asset: MediaAsset) {
  db().media.set(asset.id, asset);
  return asset;
}

export function getMedia(id: string): MediaAsset | undefined {
  return db().media.get(id) ?? db().events.find((e) => e.media?.id === id)?.media ?? undefined;
}

/** Most recently uploaded asset of a kind — used as Meta's sample when submitting media templates */
export function latestMedia(kind: MediaAsset["kind"]) {
  return [...db().media.values()].filter((m) => m.kind === kind).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
}

/* ── Messages ─────────────────────────────────────────────────────────── */

export function appendMessage(guestId: string, message: Omit<Message, "id">): Message {
  const m: Message = { ...message, id: newId("m") };
  getGuest(guestId)?.timeline.push(m);
  return m;
}

export function findMessageByWamid(wamid: string) {
  for (const guest of db().guests) {
    const message = guest.timeline.find((m) => m.wamid === wamid);
    if (message) return { guest, message };
  }
  return undefined;
}

/** Guests with this WhatsApp number, most recently invited first */
export function findGuestsByWaId(id: string) {
  return db()
    .guests.filter((guest) => waId(guest.phone) === id)
    .sort((a, b) => (b.invitedAt ?? "").localeCompare(a.invitedAt ?? ""));
}

/** Returns false if this inbound message was already handled */
export function claimInbound(wamid: string) {
  const seen = db().processedInbound;
  if (seen.has(wamid)) return false;
  seen.add(wamid);
  return true;
}

export { lastOutbound };
