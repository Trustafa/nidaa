export type RsvpStatus = "attending" | "declined" | "maybe" | "pending" | "invalid";

/** Answers a guest can give, carried in WhatsApp button payloads */
export type RsvpChoice = "attending" | "declined" | "maybe";

/** WhatsApp delivery lifecycle for messages Nidaa sends */
export type DeliveryStatus = "sent" | "delivered" | "read" | "failed";

export type MessageKind = "invitation" | "chase" | "event_reminder" | "reply" | "test";

export type MediaKind = "image" | "video";

/** A photo or video the organizer attached to an invitation */
export type MediaAsset = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  fileName: string;
  size: number;
  /** Absolute path of the stored file on this server */
  path: string;
  uploadedAt: string;
  /** Media id from WhatsApp's /media upload; reusable for ~30 days */
  wa?: { id: string; uploadedAt: string };
};

export type Message = {
  id: string;
  at: string; // ISO datetime
  from: "nidaa" | "guest";
  text: string;
  kind?: MessageKind;
  /** WhatsApp message id (wamid) — links status webhooks back to this entry */
  wamid?: string;
  delivery?: DeliveryStatus;
  error?: string;
  /** Sent while WhatsApp wasn't connected; never left Nidaa */
  simulated?: boolean;
  /** Photo or video sent above the text (invitations) */
  media?: { kind: MediaKind; assetId: string };
};

export type ReminderSettings = {
  /** Days between chasers to guests who haven't replied; 0 = off */
  chaseEveryDays: number;
  /** Stop chasing after this many chasers */
  maxChases: number;
  /** Remind attending guests this many days before the event; 0 = off */
  daysBeforeEvent: number;
};

export type Event = {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd, the event's local calendar date
  time: string; // HH:mm
  venue: string;
  /** Default for `Guest.seats` when a guest is added without one */
  maxPartySize: number;
  reminders: ReminderSettings;
  /** Optional photo or video sent with the invitation */
  media: MediaAsset | null;
  createdAt: string;
};

export type Guest = {
  id: string;
  eventId: string;
  name: string;
  phone: string; // E.164, e.g. +971501234501
  status: RsvpStatus;
  /**
   * How many people this invitation covers, including the guest. Invitations
   * usually go to the head of a family, so this is the household's size.
   */
  seats: number;
  /** Confirmed heads including the guest (≤ seats); 0 unless attending */
  partySize: number;
  /** null until the first invitation goes out */
  invitedAt: string | null;
  /** Last time the guest replied; null = no reply yet */
  updatedAt: string | null;
  /** What Nidaa is waiting to hear back on, if anything */
  awaiting: "rsvp" | "party_size" | null;
  chases: number;
  eventReminderSentAt: string | null;
  /** Waiting for tomorrow's sending allowance (WhatsApp's daily limit) */
  queued?: { kind: "invitation" | "chase"; since: string } | null;
  timeline: Message[];
};

export type EventSummary = Event & {
  /** Invitations (one per household) */
  invited: number;
  /** People covered by all invitations */
  invitedSeats: number;
  /** Confirmed headcount including party size */
  attending: number;
  attendingGuests: number;
  declined: number;
  maybe: number;
  pending: number;
  invalid: number;
  /** Guests on the list who haven't been sent an invitation yet */
  notInvited: number;
  /** Guests whose latest message failed to deliver */
  failed: number;
  /** Invitations / reminders waiting for the next day's sending allowance */
  queuedInvitations: number;
  queuedReminders: number;
};

export type Organization = {
  name: string;
  organizerName: string;
};

export const statusLabels: Record<RsvpStatus, string> = {
  attending: "Coming",
  declined: "Can't make it",
  maybe: "Maybe",
  pending: "No reply yet",
  invalid: "Unclear reply",
};
