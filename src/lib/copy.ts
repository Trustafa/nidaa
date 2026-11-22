import type { Event, Guest } from "./types";
import { TEMPLATES, renderTemplateBody, type TemplateKey } from "./whatsapp/templates";
import { fmtCardDate, fmtCardTime, plural } from "./format";

/** Free-form replies, sent inside the 24h window that opens when a guest messages us */
export const replies = {
  askPartySize: (max: number) =>
    `Wonderful! How many of your family will be coming, including you? Your invitation is for up to ${max}. Choose below, or reply with a number.`,
  /** Label on the list message's open button (WhatsApp limit: 20 characters) */
  partySizeButton: "Choose number",
  partySizeOutOfRange: (max: number) =>
    `Your invitation is for up to ${max} ${max === 1 ? "person" : "people"}. Please reply with a number from 1 to ${max}. If more of your family would like to come, please contact the hosts.`,
  confirmed: (n: number) => `Confirmed for ${n}. We look forward to seeing you!`,
  stillComing: "Lovely, see you there!",
  declined: "Thank you for letting us know. You'll be missed!",
  maybe: "No problem. We'll check in with you again closer to the date.",
  optedOut: (eventName: string) =>
    `Done. You won't get any more messages from us about ${eventName}. If you'd still like to reply, send Attending, Can't make it or Maybe at any time.`,
  notUnderstood: "Sorry, I didn't catch that. Please tap one of the buttons: Attending, Can't make it, or Maybe.",
};

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "1 person" / "up to 5 people" — who the invitation covers */
export function seatsLabel(seats: number) {
  return seats <= 1 ? "1 person" : `up to ${seats} people`;
}

/** WhatsApp rejects parameters with line breaks, tabs or runs of spaces */
function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/** "Wednesday, 23rd Sep 2026 | 12 Rabiul Akhar (Shz Saheb will arrive at 7pm)" */
export function cardDateLine(event: Pick<Event, "date" | "dateNote">) {
  const note = oneLine(event.dateNote ?? "");
  return note ? `${fmtCardDate(event.date)} | ${note}` : fmtCardDate(event.date);
}

export function templateParams(key: TemplateKey, guest: Pick<Guest, "name" | "partySize" | "seats">, event: Event) {
  const name = oneLine(guest.name);
  const hosts = oneLine(event.hostedBy ?? "") || "the hosts";
  const occasion = oneLine(event.name);
  switch (key) {
    case "invitation":
    case "invitation_image":
    case "invitation_video":
      return [name, hosts, occasion, cardDateLine(event), fmtCardTime(event.time), oneLine(event.venue), String(guest.seats)];
    case "chase":
      return [name, hosts, occasion, fmtCardDate(event.date)];
    case "event_reminder":
      return [
        name,
        occasion,
        cardDateLine(event),
        fmtCardTime(event.time),
        oneLine(event.venue),
        plural(Math.max(guest.partySize, 1), "person", "people"),
      ];
  }
}

/** The exact text a guest will see for a template message */
export function renderTemplate(key: TemplateKey, guest: Pick<Guest, "name" | "partySize" | "seats">, event: Event) {
  return renderTemplateBody(TEMPLATES[key], templateParams(key, guest, event));
}
