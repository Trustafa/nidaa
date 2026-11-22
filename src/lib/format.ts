/**
 * Organizer-facing times render in one zone on server and client so SSR and
 * hydration agree. Becomes a per-organization setting once orgs are real.
 */
export const APP_TIME_ZONE = "Asia/Dubai";

const isDateOnly = (s: string) => s.length === 10;

/** Calendar dates (yyyy-mm-dd) are zone-less; parse at UTC midnight and format in UTC. */
function calendarDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function fmtLong(isoDate: string) {
  return calendarDate(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "Saturday, 21 November 2026" — the form guests see in WhatsApp */
export function fmtInvitationDate(isoDate: string) {
  return calendarDate(isoDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** "Wednesday, 23rd Sep 2026" — the date line on the invitation card */
export function fmtCardDate(isoDate: string) {
  const d = calendarDate(isoDate);
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  // Fixed list: ICU's en-GB short month is "Sept", not "Sep"
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${weekday}, ${ordinal(d.getUTCDate())} ${month} ${d.getUTCFullYear()}`;
}

/** "19:00" → "07:00 PM" — the time line on the invitation card */
export function fmtCardTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** Accepts a calendar date or a full ISO datetime */
export function fmtShort(iso: string) {
  return isDateOnly(iso)
    ? calendarDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
    : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: APP_TIME_ZONE });
}

export function fmtTime(isoDateTime: string) {
  const d = new Date(isoDateTime);
  const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: APP_TIME_ZONE });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE });
  return `${day}, ${time}`;
}

/** "19:30" → "7:30 pm" */
export function fmtClock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Today's calendar date in the app time zone */
export function todayIso(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number) {
  const d = calendarDate(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(isoDate: string, today: string) {
  return Math.round((calendarDate(isoDate).getTime() - calendarDate(today).getTime()) / 86_400_000);
}

export function fmtDaysAway(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Good evening" in the organizer's time zone */
export function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: APP_TIME_ZONE }).format(now)
  );
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "2 hours ago", "yesterday", "3 Oct" — how a person says when something happened */
export function fmtAgo(iso: string, now = new Date()) {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = daysUntil(todayIso(now), todayIso(new Date(iso)));
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return fmtShort(iso);
}

/** "today at 4:12 pm", "tomorrow at 9:00 am", "Sat 23 Nov at 4:12 pm" */
export function fmtWhen(iso: string, now = new Date()) {
  const d = new Date(iso);
  const time = d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: APP_TIME_ZONE })
    .replace(/\s?([ap])m$/i, " $1m")
    .toLowerCase();
  const days = daysUntil(todayIso(d), todayIso(now));
  if (days === 0) return `today at ${time}`;
  if (days === 1) return `tomorrow at ${time}`;
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: APP_TIME_ZONE });
  return `${day} at ${time}`;
}
