/**
 * WhatsApp's messaging limit: a business may start conversations with only so
 * many different people in any rolling 24 hours (250 until Meta verifies the
 * business). Replies inside a conversation the guest started don't count, and
 * someone already messaged in the window doesn't use a second slot.
 *
 * Counted from the timelines, so it survives restarts with the data and needs
 * no separate bookkeeping. Practice-mode sends count too, so practice behaves
 * like the real thing.
 */
import type { MessageKind } from "./types";
import { listGuests } from "./store";
import { waId } from "./phone";
import { getDailyLimit } from "./whatsapp/config";

const WINDOW_MS = 24 * 3_600_000;
const BUSINESS_INITIATED = new Set<MessageKind>(["invitation", "chase", "event_reminder"]);

/** wa id → time Nidaa first started a conversation with them inside the window */
function contactedInWindow(now: Date) {
  const since = now.getTime() - WINDOW_MS;
  const first = new Map<string, number>();
  for (const guest of listGuests()) {
    for (const m of guest.timeline) {
      if (m.from !== "nidaa" || !m.kind || !BUSINESS_INITIATED.has(m.kind) || m.delivery === "failed") continue;
      const t = new Date(m.at).getTime();
      if (t < since) continue;
      const id = waId(guest.phone);
      const prev = first.get(id);
      if (prev === undefined || t < prev) first.set(id, t);
    }
  }
  return first;
}

export type Quota = {
  /** null when there's no cap */
  limit: number | null;
  used: number;
  remaining: number | null;
  /** When the next slot frees up, if none are left right now */
  nextSlotAt: string | null;
  queued: number;
};

export function sendingQuota(now = new Date()): Quota {
  const limit = getDailyLimit();
  const contacted = contactedInWindow(now);
  const queued = listGuests().filter((g) => g.queued).length;
  if (limit === null) return { limit, used: contacted.size, remaining: null, nextSlotAt: null, queued };
  const remaining = Math.max(0, limit - contacted.size);
  const nextSlotAt =
    remaining === 0 && contacted.size ? new Date(Math.min(...contacted.values()) + WINDOW_MS).toISOString() : null;
  return { limit, used: contacted.size, remaining, nextSlotAt, queued };
}

/**
 * Hands out the remaining slots for one batch of sends. Returns true when a
 * message to this phone may go now; the slot is taken on success.
 */
export function quotaGate(now = new Date()) {
  const limit = getDailyLimit();
  const used = new Set(contactedInWindow(now).keys());
  return (phone: string) => {
    const id = waId(phone);
    if (limit === null || used.has(id)) return true;
    if (used.size >= limit) return false;
    used.add(id);
    return true;
  };
}
