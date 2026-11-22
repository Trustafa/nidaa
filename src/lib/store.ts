/**
 * Data access for the dashboard. The working set lives in memory on
 * globalThis (so it survives hot reloads); with DATABASE_URL set, every change
 * is written through to Postgres (persist.ts) and the whole store is loaded
 * from it at startup. Without DATABASE_URL it runs on sample data that resets
 * on restart, which is handy for local practice.
 *
 * Every write goes through this module and marks what it changed. Code that
 * mutates an entity directly must call the matching touch*() function.
 *
 * Only one long-lived Node process may serve the app (`next start`).
 */
import type { Event, EventSummary, Guest, MediaAsset, Message, Organization } from "./types";
import { seed } from "./seed";
import { waId } from "./phone";
import { changedSince, loadAll, markDirty, persistenceEnabled } from "./persist";

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

const g = globalThis as unknown as { __nidaaDb?: Db; __nidaaLoading?: Promise<void> };

const DEFAULT_ORG: Organization = { name: "Nidaa", organizerName: "" };

/**
 * Load everything from Postgres into memory. Called once from
 * instrumentation.ts before the server takes requests; safe to call again.
 */
export function loadStore(): Promise<void> {
  if (g.__nidaaDb || !persistenceEnabled()) return Promise.resolve();
  g.__nidaaLoading ??= (async () => {
    const { rows, at } = await loadAll();
    const of = <T,>(kind: string) => rows.filter((r) => r.kind === kind).map((r) => r.data as T);
    g.__nidaaDb = {
      org: of<Organization>("org")[0] ?? { ...DEFAULT_ORG },
      events: of<Event>("event"),
      guests: of<Guest>("guest"),
      media: new Map(of<MediaAsset>("media").map((m) => [m.id, m])),
      processedInbound: new Set(rows.filter((r) => r.kind === "inbound").map((r) => r.id)),
      seatsMigrated: true,
    };
    console.log(`[db] loaded ${g.__nidaaDb.events.length} events, ${g.__nidaaDb.guests.length} guests`);
    // Catch writes the previous deploy made while this one was starting up
    for (const delay of [15_000, 45_000, 120_000]) {
      setTimeout(() => catchUp(at).catch((e) => console.error("[db] catch-up failed", e)), delay).unref?.();
    }
  })().finally(() => {
    g.__nidaaLoading = undefined;
  });
  return g.__nidaaLoading;
}

async function catchUp(since: string) {
  const d = g.__nidaaDb;
  if (!d) return;
  const rows = await changedSince(since);
  for (const { kind, id, data } of rows) {
    if (kind === "org") d.org = data as Organization;
    else if (kind === "event") replaceById(d.events, data as Event);
    else if (kind === "guest") replaceById(d.guests, data as Guest);
    else if (kind === "media") d.media.set(id, data as MediaAsset);
    else if (kind === "inbound") d.processedInbound.add(id);
  }
  if (rows.length) console.log(`[db] caught up on ${rows.length} changes from the previous server`);
}

function replaceById<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) list.push(item);
  else list[i] = item;
}

function db(): Db {
  if (!g.__nidaaDb) {
    if (persistenceEnabled()) throw new Error("The database hasn't finished loading yet. Try again in a moment.");
    g.__nidaaDb = { ...seed(), processedInbound: new Set(), media: new Map() };
  }
  // Stores created before newer fields existed (hot reload keeps globalThis)
  g.__nidaaDb.media ??= new Map();
  for (const event of g.__nidaaDb.events) {
    event.hostedBy ??= "";
    event.dateNote ??= "";
  }
  if (!g.__nidaaDb.seatsMigrated) {
    for (const guest of g.__nidaaDb.guests) {
      guest.seats ??= Math.max(guest.partySize, g.__nidaaDb.events.find((e) => e.id === guest.eventId)?.maxPartySize ?? 1);
    }
    g.__nidaaDb.seatsMigrated = true;
  }
  return g.__nidaaDb;
}

/** Unique across restarts and processes (ids are stored in Postgres) */
export function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ── Organization ─────────────────────────────────────────────────────── */

export function getOrg(): Organization {
  return db().org;
}

export function updateOrg(patch: Partial<Organization>) {
  const org = db().org;
  Object.assign(org, patch);
  markDirty("org", "org", org);
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
    optedOutNotInvited: 0,
    optedOutUnanswered: 0,
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
    if (guest.optedOutAt) {
      if (!guest.invitedAt) s.optedOutNotInvited++;
      else if (guest.status === "pending" || guest.status === "invalid") s.optedOutUnanswered++;
    }
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
  markDirty("event", event.id, event);
  return event;
}

export function updateEvent(id: string, patch: Partial<Omit<Event, "id" | "createdAt">>) {
  const event = getEvent(id);
  if (event) {
    Object.assign(event, patch);
    markDirty("event", id, event);
  }
  return event;
}

export function deleteEvent(id: string) {
  const d = db();
  d.events = d.events.filter((e) => e.id !== id);
  markDirty("event", id, null);
  for (const guest of d.guests) if (guest.eventId === id) markDirty("guest", guest.id, null);
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
    markDirty("guest", guest.id, guest);
    added.push(guest);
  }
  return { added, duplicates };
}

export function updateGuest(id: string, patch: Partial<Omit<Guest, "id" | "eventId" | "timeline">>) {
  const guest = getGuest(id);
  if (guest) {
    Object.assign(guest, patch);
    markDirty("guest", id, guest);
  }
  return guest;
}

/** Call after changing a guest (or one of its messages) in place */
export function touchGuest(id: string) {
  const guest = getGuest(id);
  if (guest) markDirty("guest", id, guest);
}

export function deleteGuest(id: string) {
  const d = db();
  d.guests = d.guests.filter((guest) => guest.id !== id);
  markDirty("guest", id, null);
}

export function phoneTaken(eventId: string, phone: string, exceptGuestId?: string) {
  return listGuests(eventId).some((guest) => guest.phone === phone && guest.id !== exceptGuestId);
}

/* ── Media ──────────────────────────────────────────────────────────── */

export function addMedia(asset: MediaAsset) {
  db().media.set(asset.id, asset);
  markDirty("media", asset.id, asset);
  return asset;
}

/** Remember WhatsApp's media id on the asset and on every event that embeds it */
export function recordWhatsAppMedia(assetId: string, wa: NonNullable<MediaAsset["wa"]>) {
  const d = db();
  const asset = d.media.get(assetId);
  if (asset) {
    asset.wa = wa;
    markDirty("media", assetId, asset);
  }
  for (const event of d.events) {
    if (event.media?.id === assetId) {
      event.media.wa = wa;
      markDirty("event", event.id, event);
    }
  }
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
  const guest = getGuest(guestId);
  if (guest) {
    guest.timeline.push(m);
    markDirty("guest", guestId, guest);
  }
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
  markDirty("inbound", wamid, {});
  return true;
}

export { lastOutbound };
