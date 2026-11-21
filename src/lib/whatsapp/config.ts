/**
 * WhatsApp Cloud API settings, read from the environment (see .env.example and
 * docs/whatsapp-setup.md). When the required values are missing Nidaa runs in
 * simulation mode: messages are recorded in the timeline but never sent.
 */
export type WhatsAppConfig = {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  apiVersion: string;
  verifyToken: string;
  appSecret: string;
  templateLanguage: string;
  /** Meta app id — only needed to submit photo/video templates */
  appId: string;
};

export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v25.0",
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
    appSecret: process.env.WHATSAPP_APP_SECRET ?? "",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
    appId: process.env.WHATSAPP_APP_ID ?? "",
  };
}

/**
 * How many different people Nidaa may start conversations with in any 24
 * hours. Meta allows 250 for unverified businesses and 2,000+ once verified.
 * Set WHATSAPP_DAILY_LIMIT to your current tier, or "unlimited". Null = no cap.
 */
export function getDailyLimit(): number | null {
  const raw = (process.env.WHATSAPP_DAILY_LIMIT ?? "").trim().toLowerCase();
  if (raw === "unlimited") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 250;
}

/** Enough to send messages. Webhook settings are checked separately. */
export function isWhatsAppConfigured(config = getWhatsAppConfig()) {
  return Boolean(config.phoneNumberId && config.accessToken);
}

/** Which env vars are set — values are never exposed to the UI */
export function envChecklist(config = getWhatsAppConfig()) {
  return [
    { key: "WHATSAPP_PHONE_NUMBER_ID", set: Boolean(config.phoneNumberId), required: true },
    { key: "WHATSAPP_ACCESS_TOKEN", set: Boolean(config.accessToken), required: true },
    { key: "WHATSAPP_BUSINESS_ACCOUNT_ID", set: Boolean(config.businessAccountId), required: true },
    { key: "WHATSAPP_APP_SECRET", set: Boolean(config.appSecret), required: true },
    { key: "WHATSAPP_WEBHOOK_VERIFY_TOKEN", set: Boolean(config.verifyToken), required: true },
    { key: "WHATSAPP_DAILY_LIMIT", set: Boolean(process.env.WHATSAPP_DAILY_LIMIT), required: false },
    { key: "WHATSAPP_APP_ID", set: Boolean(config.appId), required: false },
    { key: "WHATSAPP_API_VERSION", set: Boolean(process.env.WHATSAPP_API_VERSION), required: false },
    { key: "WHATSAPP_TEMPLATE_LANGUAGE", set: Boolean(process.env.WHATSAPP_TEMPLATE_LANGUAGE), required: false },
  ];
}
