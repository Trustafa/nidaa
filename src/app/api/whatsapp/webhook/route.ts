import { after, type NextRequest } from "next/server";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";
import { inboundContent, parseWebhook, verifySignature } from "@/lib/whatsapp/webhook";
import { handleInbound, handleStatus } from "@/lib/rsvp";
import { flush } from "@/lib/persist";

/**
 * Callback URL to register in Meta App Dashboard → WhatsApp → Configuration:
 *   https://<your-domain>/api/whatsapp/webhook
 * and subscribe to the `messages` field.
 */

/** Verification handshake: Meta calls this once when you save the callback URL */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const { verifyToken } = getWhatsAppConfig();
  if (
    verifyToken &&
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === verifyToken
  ) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** Inbound messages and delivery statuses */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const config = getWhatsAppConfig();

  if (config.appSecret) {
    if (!verifySignature(raw, request.headers.get("x-hub-signature-256"), config.appSecret)) {
      return new Response("Invalid signature", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Never accept unsigned webhooks in production
    console.error("[whatsapp] WHATSAPP_APP_SECRET is not set; rejecting webhook");
    return new Response("Webhook not configured", { status: 500 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { messages, statuses } = parseWebhook(body, config.phoneNumberId || undefined);

  // Acknowledge immediately; Meta retries anything that isn't a fast 200.
  // Handlers are idempotent, so a retry after a crash is safe.
  after(async () => {
    for (const status of statuses) {
      try {
        handleStatus(status);
      } catch (e) {
        console.error("[whatsapp] status handling failed", status.id, e);
      }
    }
    for (const m of messages) {
      try {
        const { text, payload } = inboundContent(m);
        await handleInbound({
          wamid: m.id,
          from: m.from,
          at: new Date(Number(m.timestamp) * 1000).toISOString(),
          text,
          payload,
        });
      } catch (e) {
        console.error("[whatsapp] inbound handling failed", m.id, e);
      }
    }
    await flush().catch((e) => console.error("[db] saving webhook changes failed", e));
  });

  return new Response("EVENT_RECEIVED", { status: 200 });
}
