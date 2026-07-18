export function fmtLong(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtShort(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function fmtTime(isoDateTime: string) {
  const d = new Date(isoDateTime);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function daysUntil(isoDate: string, todayIso: string) {
  const ms =
    new Date(`${isoDate}T00:00:00`).getTime() - new Date(`${todayIso}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/** Design-stage stand-in for the server clock */
export const TODAY = "2026-07-18";
