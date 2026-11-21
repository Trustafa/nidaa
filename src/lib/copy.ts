import type { Event, Guest } from "./types";
import { TEMPLATES, renderTemplateBody, type TemplateKey } from "./whatsapp/templates";
import { fmtClock, fmtInvitationDate, plural } from "./format";

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
  notUnderstood: "Sorry, I didn't catch that. Please tap one of the buttons: Attending, Can't make it, or Maybe.",
};

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "1 person" / "up to 5 people" — who the invitation covers */
export function seatsLabel(seats: number) {
  return seats <= 1 ? "1 person" : `up to ${seats} people`;
}

export function templateParams(key: TemplateKey, guest: Pick<Guest, "name" | "partySize" | "seats">, event: Event) {
  const base = [firstName(guest.name), event.name, fmtInvitationDate(event.date)];
  switch (key) {
    case "invitation":
    case "invitation_image":
    case "invitation_video":
      return [...base, fmtClock(event.time), event.venue, seatsLabel(guest.seats)];
    case "chase":
      return base;
    case "event_reminder":
      return [...base, fmtClock(event.time), event.venue, plural(Math.max(guest.partySize, 1), "guest")];
  }
}

/** The exact text a guest will see for a template message */
export function renderTemplate(key: TemplateKey, guest: Pick<Guest, "name" | "partySize" | "seats">, event: Event) {
  return renderTemplateBody(TEMPLATES[key], templateParams(key, guest, event));
}
