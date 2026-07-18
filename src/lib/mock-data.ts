export type RsvpStatus = "attending" | "declined" | "maybe" | "pending" | "invalid";

export type EventSummary = {
  id: string;
  name: string;
  date: string; // ISO date
  invited: number;
  attending: number; // confirmed headcount incl. party size
  declined: number;
  maybe: number;
  pending: number;
  invalid: number;
};

export type TimelineEntry = {
  at: string; // ISO datetime
  from: "nidaa" | "guest";
  text: string;
};

export type Guest = {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  status: RsvpStatus;
  /** Confirmed heads including the guest; 0 until they attend */
  partySize: number;
  updatedAt: string | null; // null = no reply yet
  timeline: TimelineEntry[];
};

export type ActivityRow = {
  id: string;
  guest: string;
  event: string;
  status: RsvpStatus;
  updatedAt: string; // ISO date
};

export const events: EventSummary[] = [
  {
    id: "misaaq-jaman",
    name: "Misaaq Jaman",
    date: "2026-09-25",
    invited: 214,
    attending: 78,
    declined: 9,
    maybe: 14,
    pending: 110,
    invalid: 3,
  },
  {
    id: "menna-hassan",
    name: "Menna & Hassan Engagement",
    date: "2026-07-26",
    invited: 96,
    attending: 61,
    declined: 7,
    maybe: 5,
    pending: 22,
    invalid: 1,
  },
];

const invitationText =
  "You're invited to the wedding of Misaaq Jaman on 25 Sept 2026. Will you be joining us?";

function sent(at: string, text = invitationText): TimelineEntry {
  return { at, from: "nidaa", text };
}

export const guests: Guest[] = [
  {
    id: "g1",
    eventId: "misaaq-jaman",
    name: "Ayesha Khan",
    phone: "+971 50 123 4501",
    status: "attending",
    partySize: 2,
    updatedAt: "2026-07-18",
    timeline: [
      sent("2026-07-15T10:00:00"),
      { at: "2026-07-18T09:12:00", from: "guest", text: "Attending" },
      { at: "2026-07-18T09:12:10", from: "nidaa", text: "Wonderful! How many of you will be joining? Reply with a number." },
      { at: "2026-07-18T09:14:00", from: "guest", text: "2" },
      { at: "2026-07-18T09:14:05", from: "nidaa", text: "Confirmed for 2. We look forward to seeing you!" },
    ],
  },
  {
    id: "g2",
    eventId: "misaaq-jaman",
    name: "John Doe",
    phone: "+971 50 123 4502",
    status: "attending",
    partySize: 1,
    updatedAt: "2026-07-17",
    timeline: [
      sent("2026-07-15T10:00:00"),
      { at: "2026-07-17T18:40:00", from: "guest", text: "Attending" },
      { at: "2026-07-17T18:40:05", from: "nidaa", text: "Wonderful! How many of you will be joining? Reply with a number." },
      { at: "2026-07-17T18:41:00", from: "guest", text: "1" },
      { at: "2026-07-17T18:41:05", from: "nidaa", text: "Confirmed for 1. We look forward to seeing you!" },
    ],
  },
  {
    id: "g3",
    eventId: "misaaq-jaman",
    name: "Mark Johnson",
    phone: "+971 50 123 4503",
    status: "invalid",
    partySize: 0,
    updatedAt: "2026-07-16",
    timeline: [
      sent("2026-07-15T10:00:00"),
      { at: "2026-07-16T11:02:00", from: "guest", text: "inshallah we will try, depends on flights" },
      { at: "2026-07-16T11:02:05", from: "nidaa", text: "Sorry, I didn't catch that. Please tap one of the buttons: Attending, Can't make it, or Maybe." },
    ],
  },
  {
    id: "g4",
    eventId: "misaaq-jaman",
    name: "Sara Haddad",
    phone: "+971 50 123 4504",
    status: "pending",
    partySize: 0,
    updatedAt: null,
    timeline: [sent("2026-07-15T10:00:00"), sent("2026-07-16T10:00:00", "A gentle reminder: will you be joining the wedding of Misaaq Jaman on 25 Sept 2026?")],
  },
  {
    id: "g5",
    eventId: "misaaq-jaman",
    name: "Khalid Al Mansoori",
    phone: "+971 50 123 4505",
    status: "attending",
    partySize: 4,
    updatedAt: "2026-07-16",
    timeline: [
      sent("2026-07-15T10:00:00"),
      { at: "2026-07-16T20:05:00", from: "guest", text: "Attending" },
      { at: "2026-07-16T20:05:05", from: "nidaa", text: "Wonderful! How many of you will be joining? Reply with a number." },
      { at: "2026-07-16T20:06:00", from: "guest", text: "4" },
      { at: "2026-07-16T20:06:05", from: "nidaa", text: "Confirmed for 4. We look forward to seeing you!" },
    ],
  },
  {
    id: "g6",
    eventId: "misaaq-jaman",
    name: "Layla Ibrahim",
    phone: "+971 50 123 4506",
    status: "maybe",
    partySize: 0,
    updatedAt: "2026-07-16",
    timeline: [
      sent("2026-07-15T10:00:00"),
      { at: "2026-07-16T14:30:00", from: "guest", text: "Maybe" },
      { at: "2026-07-16T14:30:05", from: "nidaa", text: "No problem. We'll check in with you again closer to the date." },
    ],
  },
  {
    id: "g7",
    eventId: "misaaq-jaman",
    name: "Yusuf Rahman",
    phone: "+971 50 123 4507",
    status: "declined",
    partySize: 0,
    updatedAt: "2026-07-15",
    timeline: [
      sent("2026-07-15T10:00:00"),
      { at: "2026-07-15T16:20:00", from: "guest", text: "Can't make it" },
      { at: "2026-07-15T16:20:05", from: "nidaa", text: "Thank you for letting us know. You'll be missed!" },
    ],
  },
  {
    id: "g8",
    eventId: "misaaq-jaman",
    name: "Noor Al Suwaidi",
    phone: "+971 50 123 4508",
    status: "pending",
    partySize: 0,
    updatedAt: null,
    timeline: [sent("2026-07-15T10:00:00")],
  },
  {
    id: "g9",
    eventId: "misaaq-jaman",
    name: "Hana Sheikh",
    phone: "+971 50 123 4509",
    status: "attending",
    partySize: 3,
    updatedAt: "2026-07-15",
    timeline: [
      sent("2026-07-15T10:00:00"),
      { at: "2026-07-15T12:00:00", from: "guest", text: "Attending" },
      { at: "2026-07-15T12:00:05", from: "nidaa", text: "Wonderful! How many of you will be joining? Reply with a number." },
      { at: "2026-07-15T12:01:00", from: "guest", text: "3" },
      { at: "2026-07-15T12:01:05", from: "nidaa", text: "Confirmed for 3. We look forward to seeing you!" },
    ],
  },
  {
    id: "g10",
    eventId: "misaaq-jaman",
    name: "Bilal Chaudhry",
    phone: "+971 50 123 4510",
    status: "pending",
    partySize: 0,
    updatedAt: null,
    timeline: [sent("2026-07-15T10:00:00")],
  },
  {
    id: "g11",
    eventId: "menna-hassan",
    name: "Omar Farooq",
    phone: "+971 55 987 6501",
    status: "maybe",
    partySize: 0,
    updatedAt: "2026-07-18",
    timeline: [
      sent("2026-07-10T09:00:00", "You're invited to Menna & Hassan's engagement on 26 Jul 2026. Will you be joining us?"),
      { at: "2026-07-18T08:00:00", from: "guest", text: "Maybe" },
      { at: "2026-07-18T08:00:05", from: "nidaa", text: "No problem. We'll check in with you again closer to the date." },
    ],
  },
  {
    id: "g12",
    eventId: "menna-hassan",
    name: "Fatima Al Ali",
    phone: "+971 55 987 6502",
    status: "declined",
    partySize: 0,
    updatedAt: "2026-07-17",
    timeline: [
      sent("2026-07-10T09:00:00", "You're invited to Menna & Hassan's engagement on 26 Jul 2026. Will you be joining us?"),
      { at: "2026-07-17T19:00:00", from: "guest", text: "Can't make it" },
      { at: "2026-07-17T19:00:05", from: "nidaa", text: "Thank you for letting us know. You'll be missed!" },
    ],
  },
  {
    id: "g13",
    eventId: "menna-hassan",
    name: "Emily Davis",
    phone: "+971 55 987 6503",
    status: "attending",
    partySize: 2,
    updatedAt: "2026-07-15",
    timeline: [
      sent("2026-07-10T09:00:00", "You're invited to Menna & Hassan's engagement on 26 Jul 2026. Will you be joining us?"),
      { at: "2026-07-15T10:30:00", from: "guest", text: "Attending" },
      { at: "2026-07-15T10:30:05", from: "nidaa", text: "Wonderful! How many of you will be joining? Reply with a number." },
      { at: "2026-07-15T10:32:00", from: "guest", text: "2" },
      { at: "2026-07-15T10:32:05", from: "nidaa", text: "Confirmed for 2. We look forward to seeing you!" },
    ],
  },
  {
    id: "g14",
    eventId: "menna-hassan",
    name: "Rashid Al Nuaimi",
    phone: "+971 55 987 6504",
    status: "attending",
    partySize: 1,
    updatedAt: "2026-07-14",
    timeline: [
      sent("2026-07-10T09:00:00", "You're invited to Menna & Hassan's engagement on 26 Jul 2026. Will you be joining us?"),
      { at: "2026-07-14T15:00:00", from: "guest", text: "Attending" },
      { at: "2026-07-14T15:00:05", from: "nidaa", text: "Wonderful! How many of you will be joining? Reply with a number." },
      { at: "2026-07-14T15:01:00", from: "guest", text: "1" },
      { at: "2026-07-14T15:01:05", from: "nidaa", text: "Confirmed for 1. We look forward to seeing you!" },
    ],
  },
  {
    id: "g15",
    eventId: "menna-hassan",
    name: "Zainab Qureshi",
    phone: "+971 55 987 6505",
    status: "pending",
    partySize: 0,
    updatedAt: null,
    timeline: [sent("2026-07-10T09:00:00", "You're invited to Menna & Hassan's engagement on 26 Jul 2026. Will you be joining us?")],
  },
];

export const recentActivity: ActivityRow[] = [
  { id: "a1", guest: "Ayesha Khan", event: "Misaaq Jaman", status: "attending", updatedAt: "2026-07-18" },
  { id: "a2", guest: "Omar Farooq", event: "Menna & Hassan Engagement", status: "maybe", updatedAt: "2026-07-18" },
  { id: "a3", guest: "John Doe", event: "Misaaq Jaman", status: "attending", updatedAt: "2026-07-17" },
  { id: "a4", guest: "Fatima Al Ali", event: "Menna & Hassan Engagement", status: "declined", updatedAt: "2026-07-17" },
  { id: "a5", guest: "Mark Johnson", event: "Misaaq Jaman", status: "invalid", updatedAt: "2026-07-16" },
  { id: "a6", guest: "Sara Haddad", event: "Misaaq Jaman", status: "pending", updatedAt: "2026-07-16" },
  { id: "a7", guest: "Emily Davis", event: "Menna & Hassan Engagement", status: "attending", updatedAt: "2026-07-15" },
];

export const statusLabels: Record<RsvpStatus, string> = {
  attending: "Attending",
  declined: "Can't make it",
  maybe: "Maybe",
  pending: "Pending",
  invalid: "Needs attention",
};
