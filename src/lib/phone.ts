/**
 * Phone numbers are stored in E.164 (+971501234501). WhatsApp's `to` field and
 * inbound `from` (wa_id) use the same digits without the plus.
 */

export const DEFAULT_COUNTRY_CODE = "971";

/** Normalize what an organizer typed or imported. Returns null if it can't be a valid number. */
export function normalizePhone(input: string, defaultCountryCode = DEFAULT_COUNTRY_CODE): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) {
    digits = digits.slice(1).replace(/\+/g, "");
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    // Local trunk prefix, e.g. 050 123 4567 in the UAE
    digits = defaultCountryCode + digits.slice(1);
  } else if (digits.length <= 9) {
    // Local number typed without the trunk 0
    digits = defaultCountryCode + digits;
  }

  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `+${digits}`;
}

/** Digits only, as WhatsApp expects in `to` and sends in `from` */
export function waId(e164: string) {
  return e164.replace(/\D/g, "");
}

/** Human-friendly display. UAE mobiles get local grouping; others stay E.164. */
export function formatPhone(e164: string) {
  const m = /^\+971(5\d)(\d{3})(\d{4})$/.exec(e164);
  if (m) return `+971 ${m[1]} ${m[2]} ${m[3]}`;
  const uk = /^\+44(7\d{3})(\d{6})$/.exec(e164);
  if (uk) return `+44 ${uk[1]} ${uk[2]}`;
  return e164;
}
