import { getWhatsAppConfig, type WhatsAppConfig } from "./config";

const GRAPH = "https://graph.facebook.com";

export class WhatsAppError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly status?: number,
    readonly details?: string
  ) {
    super(message);
    this.name = "WhatsAppError";
  }
}

type GraphErrorBody = {
  error?: { message?: string; code?: number; error_user_msg?: string; error_data?: { details?: string } };
};

async function graph<T>(path: string, init: RequestInit = {}, config: WhatsAppConfig = getWhatsAppConfig()): Promise<T> {
  const res = await fetch(`${GRAPH}/${config.apiVersion}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T & GraphErrorBody;
  if (!res.ok || body.error) {
    const e = body.error ?? {};
    throw new WhatsAppError(
      e.error_user_msg || e.message || `Graph API request failed (${res.status})`,
      e.code,
      res.status,
      e.error_data?.details
    );
  }
  return body;
}

/** POST /{phone-number-id}/messages — returns the wamid */
export async function sendMessage(payload: object): Promise<string> {
  const config = getWhatsAppConfig();
  const res = await graph<{ messages?: { id: string }[] }>(
    `${config.phoneNumberId}/messages`,
    { method: "POST", body: JSON.stringify(payload) },
    config
  );
  const id = res.messages?.[0]?.id;
  if (!id) throw new WhatsAppError("WhatsApp accepted the request but returned no message id");
  return id;
}

export type PhoneNumberInfo = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  name_status?: string;
  code_verification_status?: string;
  platform_type?: string;
};

export function getPhoneNumberInfo() {
  const config = getWhatsAppConfig();
  return graph<PhoneNumberInfo>(
    `${config.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,name_status,code_verification_status,platform_type`,
    {},
    config
  );
}

export type RemoteTemplate = {
  id: string;
  name: string;
  status: string; // APPROVED, PENDING, REJECTED, PAUSED, DISABLED
  category: string;
  language: string;
  rejected_reason?: string;
};

export async function listTemplates() {
  const config = getWhatsAppConfig();
  const res = await graph<{ data: RemoteTemplate[] }>(
    `${config.businessAccountId}/message_templates?fields=name,status,category,language,rejected_reason&limit=100`,
    {},
    config
  );
  return res.data;
}

export function createTemplate(body: object) {
  const config = getWhatsAppConfig();
  return graph<{ id: string; status: string; category: string }>(
    `${config.businessAccountId}/message_templates`,
    { method: "POST", body: JSON.stringify(body) },
    config
  );
}

/** Whether this app receives the WABA's webhooks (POST /{waba-id}/subscribed_apps to enable) */
export async function listSubscribedApps() {
  const config = getWhatsAppConfig();
  const res = await graph<{ data: { whatsapp_business_api_data?: { name?: string; id?: string } }[] }>(
    `${config.businessAccountId}/subscribed_apps`,
    {},
    config
  );
  return res.data;
}

export function subscribeApp() {
  const config = getWhatsAppConfig();
  return graph<{ success: boolean }>(`${config.businessAccountId}/subscribed_apps`, { method: "POST" }, config);
}

async function readGraphResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & GraphErrorBody;
  if (!res.ok || body.error) {
    const e = body.error ?? {};
    throw new WhatsAppError(e.error_user_msg || e.message || `Graph API request failed (${res.status})`, e.code, res.status, e.error_data?.details);
  }
  return body;
}

/**
 * POST /{phone-number-id}/media — gives WhatsApp its own copy of a photo or
 * video and returns a media id to send with. Ids stay usable for about 30 days.
 */
export async function uploadMedia(file: Blob, mimeType: string, fileName: string): Promise<string> {
  const config = getWhatsAppConfig();
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mimeType);
  form.append("file", file, fileName);
  const res = await fetch(`${GRAPH}/${config.apiVersion}/${config.phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.accessToken}` },
    body: form,
    cache: "no-store",
  });
  const body = await readGraphResponse<{ id?: string }>(res);
  if (!body.id) throw new WhatsAppError("WhatsApp accepted the upload but returned no media id");
  return body.id;
}

/**
 * Resumable Upload API — returns the file handle Meta's reviewers need as the
 * sample when a template with a photo or video header is submitted.
 * Needs WHATSAPP_APP_ID (App Dashboard → App settings → Basic).
 */
export async function uploadTemplateSample(file: Blob, mimeType: string, fileName: string): Promise<string> {
  const config = getWhatsAppConfig();
  if (!config.appId) throw new WhatsAppError("Set WHATSAPP_APP_ID to submit photo and video templates.");
  const session = await readGraphResponse<{ id?: string }>(
    await fetch(
      `${GRAPH}/${config.apiVersion}/${config.appId}/uploads?` +
        // This step takes the token as a query parameter; the byte upload below takes it as a header
        new URLSearchParams({
          file_name: fileName,
          file_length: String(file.size),
          file_type: mimeType,
          access_token: config.accessToken,
        }),
      { method: "POST", cache: "no-store" }
    )
  );
  if (!session.id) throw new WhatsAppError("Meta didn't start the sample upload");
  const done = await readGraphResponse<{ h?: string }>(
    await fetch(`${GRAPH}/${config.apiVersion}/${session.id}`, {
      method: "POST",
      headers: { Authorization: `OAuth ${config.accessToken}`, file_offset: "0" },
      body: file,
      cache: "no-store",
    })
  );
  if (!done.h) throw new WhatsAppError("Meta didn't return a handle for the sample file");
  return done.h;
}
