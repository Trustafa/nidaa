/**
 * Message templates Nidaa needs approved in WhatsApp Manager. Business-initiated
 * messages (anything sent outside the 24h window after a guest's last message)
 * must use an approved template, so invitations, chasers and event reminders
 * are all templates. Replies inside the window (party-size questions,
 * confirmations) are free-form and live in rsvp.ts.
 *
 * Bodies use positional {{n}} parameters. Quick-reply buttons get a per-message
 * payload at send time so a tap maps straight back to one guest and one answer.
 */
import type { RsvpChoice } from "../types";

export type TemplateKey = "invitation" | "invitation_image" | "invitation_video" | "chase" | "event_reminder";

export type TemplateDefinition = {
  name: string;
  category: "UTILITY" | "MARKETING";
  /**
   * Media shown above the text. Meta fixes a template's header type when it
   * approves it, so each media kind needs its own approved template.
   */
  header?: "IMAGE" | "VIDEO";
  body: string;
  /** Sample values Meta requires when the template is submitted for review */
  example: string[];
  buttons: { text: string; choice: RsvpChoice }[];
};

const rsvpButtons: TemplateDefinition["buttons"] = [
  { text: "Attending", choice: "attending" },
  { text: "Can't make it", choice: "declined" },
  { text: "Maybe", choice: "maybe" },
];

const invitation: TemplateDefinition = {
  name: "nidaa_invitation",
  // Meta classifies unsolicited event invitations as marketing (and would
  // recategorize a utility submission). See docs/whatsapp-setup.md.
  category: "MARKETING",
  // Sent to the head of a family; {{6}} says how many people it covers
  body:
    "Hello {{1}}, you're invited to {{2}} on {{3}} at {{4}}, {{5}}. " +
    "This invitation is for {{6}}.\n\n" +
    "Will you be joining us? Tap a button below to reply.",
  example: ["Ayesha", "the wedding of Sara & Omar", "Saturday, 21 November 2026", "7:00 pm", "Al Habtoor Palace, Dubai", "up to 5 people"],
  buttons: rsvpButtons,
};

export const TEMPLATES: Record<TemplateKey, TemplateDefinition> = {
  invitation,
  invitation_image: { ...invitation, name: "nidaa_invitation_image", header: "IMAGE" },
  invitation_video: { ...invitation, name: "nidaa_invitation_video", header: "VIDEO" },
  chase: {
    name: "nidaa_rsvp_reminder",
    category: "MARKETING",
    body:
      "Hello {{1}}, a gentle reminder about {{2}} on {{3}}. " +
      "We haven't had your reply yet. Will you be joining us?",
    example: ["Ayesha", "the wedding of Sara & Omar", "Saturday, 21 November 2026"],
    buttons: rsvpButtons,
  },
  event_reminder: {
    name: "nidaa_event_reminder",
    // Details for an event the guest already accepted — a utility candidate
    category: "UTILITY",
    body:
      "Hello {{1}}, we're looking forward to seeing you at {{2}} on {{3}} at {{4}}, {{5}}. " +
      "We have you down for {{6}}. If your plans have changed, let us know below.",
    example: ["Ayesha", "the wedding of Sara & Omar", "Saturday, 21 November 2026", "7:00 pm", "Al Habtoor Palace, Dubai", "2 guests"],
    buttons: [
      { text: "See you there", choice: "attending" },
      { text: "Can't make it", choice: "declined" },
    ],
  },
};

/** Fill {{n}} placeholders — used for the timeline and the in-app preview */
export function renderTemplateBody(template: TemplateDefinition, params: string[]) {
  return template.body.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] ?? "");
}

/** Button payloads look like `rsvp:<guestId>:<choice>` */
export function rsvpPayload(guestId: string, choice: RsvpChoice) {
  return `rsvp:${guestId}:${choice}`;
}

/** Party-size picks look like `party:<guestId>:<n>` */
export function partyPayload(guestId: string, size: number) {
  return `party:${guestId}:${size}`;
}

export function parsePartyPayload(payload: string): { guestId: string; size: number } | null {
  const m = /^party:([^:]+):(\d{1,2})$/.exec(payload);
  return m ? { guestId: m[1], size: Number(m[2]) } : null;
}

export function parseRsvpPayload(payload: string): { guestId: string; choice: RsvpChoice } | null {
  const m = /^rsvp:([^:]+):(attending|declined|maybe)$/.exec(payload);
  return m ? { guestId: m[1], choice: m[2] as RsvpChoice } : null;
}

/** The invitation template to use for an event's attached media, if any */
export function invitationTemplateKey(mediaKind?: "image" | "video" | null): TemplateKey {
  return mediaKind === "image" ? "invitation_image" : mediaKind === "video" ? "invitation_video" : "invitation";
}

/** Request body for POST /{phone-number-id}/messages */
export function templateMessage(
  to: string,
  template: TemplateDefinition,
  params: string[],
  guestId: string,
  language: string,
  /** WhatsApp media id for the header; required when the template has one */
  headerMediaId?: string
) {
  const header =
    template.header && headerMediaId
      ? [
          {
            type: "header",
            parameters: [
              template.header === "IMAGE"
                ? { type: "image", image: { id: headerMediaId } }
                : { type: "video", video: { id: headerMediaId } },
            ],
          },
        ]
      : [];
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: template.name,
      language: { code: language },
      components: [
        ...header,
        {
          type: "body",
          parameters: params.map((text) => ({ type: "text", text })),
        },
        ...template.buttons.map((button, index) => ({
          type: "button",
          sub_type: "quick_reply",
          index: String(index),
          parameters: [{ type: "payload", payload: rsvpPayload(guestId, button.choice) }],
        })),
      ],
    },
  };
}

/**
 * Request body for POST /{waba-id}/message_templates. Media templates need a
 * sample file's upload handle (Resumable Upload API) for Meta's reviewers.
 */
export function templateCreationRequest(template: TemplateDefinition, language: string, headerHandle?: string) {
  return {
    name: template.name,
    category: template.category,
    language,
    components: [
      ...(template.header
        ? [{ type: "HEADER", format: template.header, example: { header_handle: [headerHandle ?? ""] } }]
        : []),
      {
        type: "BODY",
        text: template.body,
        example: { body_text: [template.example] },
      },
      {
        type: "BUTTONS",
        buttons: template.buttons.map((b) => ({ type: "QUICK_REPLY", text: b.text })),
      },
    ],
  };
}
