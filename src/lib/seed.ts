/**
 * Demo data for the in-memory store. Dates are relative to the moment the store
 * is created so the dashboard always shows upcoming events. Deterministic, so
 * every server start produces the same guest list.
 */
import type { Event, Guest, Message, Organization, RsvpStatus } from "./types";
import { addDays, todayIso } from "./format";
import { renderTemplate, replies } from "./copy";

function prng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Ayesha", "John", "Mark", "Sara", "Khalid", "Layla", "Yusuf", "Noor", "Hana", "Bilal", "Omar", "Fatima",
  "Emily", "Rashid", "Zainab", "Ahmed", "Mariam", "Hamza", "Aisha", "Tariq", "Salma", "Imran", "Rania",
  "Faisal", "Huda", "Daniel", "Leila", "Karim", "Nadia", "Sami", "Yasmin", "Adam", "Lina", "Zayd", "Amira",
  "Hassan", "Dina", "Ibrahim", "Reem", "Ali", "Maya", "Saif", "Joanna", "Mohammed", "Priya", "Ravi",
];
const LAST = [
  "Khan", "Doe", "Johnson", "Haddad", "Al Mansoori", "Ibrahim", "Rahman", "Al Suwaidi", "Sheikh", "Chaudhry",
  "Farooq", "Al Ali", "Davis", "Al Nuaimi", "Qureshi", "Saleh", "Nasser", "Al Hashimi", "Mansour", "Aziz",
  "Kapoor", "Hussain", "Malik", "Al Zaabi", "Thomas", "Fernandes", "Al Marzouqi", "Siddiqui", "Bakr", "Youssef",
];

type SeedEvent = {
  event: Event;
  guestCount: number;
  /** Days before today the invitations went out; null = not sent yet */
  invitedDaysAgo: number | null;
  mix: Partial<Record<RsvpStatus, number>>;
  failed?: number;
};

/** Invitations go to the head of a family: mostly couples and small families, some singles */
function familySize(rand: () => number, max: number) {
  const r = rand();
  const size = r < 0.18 ? 1 : r < 0.55 ? 2 : r < 0.75 ? 3 : r < 0.9 ? 4 : 5 + Math.floor(rand() * 2);
  return Math.min(size, Math.max(max, 1));
}

let msgSeq = 0;
const msgId = () => `m${++msgSeq}`;

function at(base: Date, hoursOffset: number) {
  return new Date(base.getTime() + hoursOffset * 3_600_000).toISOString();
}

export function seed(now = new Date()): { org: Organization; events: Event[]; guests: Guest[] } {
  const today = todayIso(now);
  const rand = prng(7);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

  const reminders = { chaseEveryDays: 3, maxChases: 2, daysBeforeEvent: 2 };
  const plan: SeedEvent[] = [
    {
      event: {
        id: "misaaq-jaman",
        name: "Misaaq Jaman",
        date: addDays(today, 47),
        time: "19:00",
        venue: "Al Habtoor Palace, Dubai",
        hostedBy: "Mulla Hatim & Zainab Lokhandwala",
        dateNote: "",
        maxPartySize: 6,
        reminders,
        media: null,
        createdAt: at(now, -24 * 20),
      },
      guestCount: 120,
      invitedDaysAgo: 12,
      mix: { attending: 0.42, declined: 0.06, maybe: 0.08, invalid: 0.025 },
      failed: 2,
    },
    {
      event: {
        id: "menna-hassan",
        name: "Menna & Hassan Engagement",
        date: addDays(today, 19),
        time: "18:30",
        venue: "Emirates Golf Club, Dubai",
        hostedBy: "the families of Menna & Hassan",
        dateNote: "",
        maxPartySize: 5,
        reminders,
        media: null,
        createdAt: at(now, -24 * 30),
      },
      guestCount: 64,
      invitedDaysAgo: 20,
      mix: { attending: 0.62, declined: 0.09, maybe: 0.06, invalid: 0.016 },
    },
    {
      event: {
        id: "rania-60th",
        name: "Rania's 60th Birthday Dinner",
        date: addDays(today, 68),
        time: "20:00",
        venue: "Zuma, DIFC",
        hostedBy: "Rania's children",
        dateNote: "",
        maxPartySize: 4,
        reminders: { chaseEveryDays: 4, maxChases: 2, daysBeforeEvent: 3 },
        media: null,
        createdAt: at(now, -24 * 2),
      },
      guestCount: 38,
      invitedDaysAgo: null,
      mix: {},
    },
  ];

  const guests: Guest[] = [];
  const usedNames = new Set<string>();
  let phoneSeq = 4500;
  let guestSeq = 0;

  for (const { event, guestCount, invitedDaysAgo, mix, failed = 0 } of plan) {
    const invitedAt = invitedDaysAgo === null ? null : at(now, -24 * invitedDaysAgo - 3);
    const statuses: RsvpStatus[] = [];
    for (const [status, share] of Object.entries(mix) as [RsvpStatus, number][]) {
      for (let i = 0; i < Math.round(guestCount * share); i++) statuses.push(status);
    }
    while (statuses.length < guestCount) statuses.push("pending");
    // Shuffle so statuses aren't clustered by name order
    for (let i = statuses.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
    }

    let failedLeft = failed;
    for (const status of statuses) {
      let name: string;
      do name = `${pick(FIRST)} ${pick(LAST)}`;
      while (usedNames.has(name) && usedNames.size < FIRST.length * LAST.length);
      usedNames.add(name);
      const isUae = rand() > 0.12;
      const phone = isUae
        ? `+97150${String(1000000 + ++phoneSeq * 37).slice(-7)}`
        : `+4477009${String(10000 + ++phoneSeq).slice(-5)}`;

      const guest: Guest = {
        id: `g${++guestSeq}`,
        eventId: event.id,
        name,
        phone,
        status: invitedAt ? status : "pending",
        seats: familySize(rand, event.maxPartySize),
        partySize: 0,
        invitedAt,
        updatedAt: null,
        awaiting: invitedAt ? "rsvp" : null,
        chases: 0,
        eventReminderSentAt: null,
        timeline: [],
      };

      if (invitedAt) buildTimeline(guest, event, new Date(invitedAt), now, rand, status === "pending" && failedLeft-- > 0);
      guests.push(guest);
    }
  }

  return {
    org: { name: "Turrino Events", organizerName: "Mustafa" },
    events: plan.map((p) => p.event),
    guests,
  };
}

function buildTimeline(guest: Guest, event: Event, invitedAt: Date, now: Date, rand: () => number, failed: boolean) {
  const out = (atIso: string, text: string, kind: Message["kind"], delivery: Message["delivery"] = "read"): Message => ({
    id: msgId(),
    at: atIso,
    from: "nidaa",
    text,
    kind,
    delivery,
    wamid: `seed.${msgId()}`,
  });
  const inbound = (atIso: string, text: string): Message => ({ id: msgId(), at: atIso, from: "guest", text, kind: "reply" });

  if (failed) {
    guest.timeline.push({
      ...out(invitedAt.toISOString(), renderTemplate("invitation", guest, event), "invitation", "failed"),
      error: "Message undeliverable (131026). The number may not be on WhatsApp.",
    });
    return;
  }

  const hoursSinceInvite = (now.getTime() - invitedAt.getTime()) / 3_600_000;
  const replyAfter = Math.min(hoursSinceInvite - 2, 2 + rand() * 24 * 6);
  const replyAt = (extraMin = 0) => at(invitedAt, replyAfter + extraMin / 60);

  guest.timeline.push(
    out(invitedAt.toISOString(), renderTemplate("invitation", guest, event), "invitation", guest.status === "pending" ? "delivered" : "read")
  );

  switch (guest.status) {
    case "attending": {
      // Families don't always bring everyone
      const size = Math.max(1, guest.seats - (rand() > 0.7 ? 1 : 0));
      guest.timeline.push(
        inbound(replyAt(), "Attending"),
        out(replyAt(0.1), replies.askPartySize(guest.seats), "reply"),
        inbound(replyAt(2), String(size)),
        out(replyAt(2.1), replies.confirmed(size), "reply")
      );
      guest.partySize = size;
      guest.awaiting = null;
      guest.updatedAt = replyAt(2);
      break;
    }
    case "declined":
      guest.timeline.push(inbound(replyAt(), "Can't make it"), out(replyAt(0.1), replies.declined, "reply"));
      guest.awaiting = null;
      guest.updatedAt = replyAt();
      break;
    case "maybe":
      guest.timeline.push(inbound(replyAt(), "Maybe"), out(replyAt(0.1), replies.maybe, "reply"));
      guest.awaiting = null;
      guest.updatedAt = replyAt();
      break;
    case "invalid": {
      const said = rand() > 0.5 ? "inshallah we will try, depends on flights" : "Who is this?";
      guest.timeline.push(inbound(replyAt(), said), out(replyAt(0.1), replies.notUnderstood, "reply"));
      guest.updatedAt = replyAt();
      break;
    }
    case "pending": {
      // One chaser for anyone who has been quiet past the chase interval
      if (hoursSinceInvite > 24 * 3.2) {
        guest.timeline.push(out(at(invitedAt, 24 * 3), renderTemplate("chase", guest, event), "chase", "delivered"));
        guest.chases = 1;
      }
      break;
    }
  }
}
