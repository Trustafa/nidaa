import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Meta signs every webhook POST with HMAC-SHA256 of the raw body using the
 * App Secret: `X-Hub-Signature-256: sha256=<hex>`. Verify before parsing.
 */
export function verifySignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** The subset of the `messages` webhook Nidaa reads */
export type InboundMessage = {
  id: string; // wamid
  from: string; // wa_id, digits only
  timestamp: string; // unix seconds
  type: string;
  text?: { body: string };
  /** Tap on a template quick-reply button */
  button?: { payload: string; text: string };
  /** Tap on an interactive (non-template) reply button */
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
};

export type StatusUpdate = {
  id: string; // wamid of the message we sent
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string; message?: string; error_data?: { details?: string } }[];
};

type WebhookBody = {
  object?: string;
  entry?: {
    id: string; // WABA id
    changes?: {
      field: string;
      value?: {
        metadata?: { phone_number_id: string; display_phone_number: string };
        contacts?: { wa_id: string; profile?: { name?: string } }[];
        messages?: InboundMessage[];
        statuses?: StatusUpdate[];
      };
    }[];
  }[];
};

/** Flatten a webhook delivery into messages and statuses for our phone number */
export function parseWebhook(body: unknown, phoneNumberId?: string) {
  const messages: InboundMessage[] = [];
  const statuses: StatusUpdate[] = [];
  const b = body as WebhookBody;
  if (b?.object !== "whatsapp_business_account") return { messages, statuses };

  for (const entry of b.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages" || !change.value) continue;
      const v = change.value;
      // One app can serve several numbers; ignore traffic for numbers that aren't ours.
      if (phoneNumberId && v.metadata?.phone_number_id && v.metadata.phone_number_id !== phoneNumberId) continue;
      messages.push(...(v.messages ?? []));
      statuses.push(...(v.statuses ?? []));
    }
  }
  return { messages, statuses };
}

/** What the guest said, in a form the RSVP engine understands */
export function inboundContent(m: InboundMessage): { payload?: string; text: string } {
  if (m.button) return { payload: m.button.payload, text: m.button.text };
  if (m.interactive?.button_reply) return { payload: m.interactive.button_reply.id, text: m.interactive.button_reply.title };
  if (m.interactive?.list_reply) return { payload: m.interactive.list_reply.id, text: m.interactive.list_reply.title };
  if (m.text) return { text: m.text.body };
  return { text: `[${m.type} message]` };
}
