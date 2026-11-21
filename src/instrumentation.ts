/**
 * In-process scheduler for long-running servers (`next dev`, `next start`):
 * every 15 minutes it runs the same job as /api/cron/reminders, so queued
 * invitations go out as WhatsApp's daily limit frees up without any external
 * cron. On serverless hosting, schedule /api/cron/reminders instead and set
 * NIDAA_SCHEDULER=off.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NIDAA_SCHEDULER === "off") return;

  const g = globalThis as unknown as { __nidaaScheduler?: ReturnType<typeof setInterval> };
  if (g.__nidaaScheduler) return;

  const { runScheduledReminders } = await import("./lib/rsvp");
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const r = await runScheduledReminders();
      if (r.dequeued || r.chased || r.reminded) console.log("[scheduler]", r);
    } catch (e) {
      console.error("[scheduler] run failed", e);
    } finally {
      running = false;
    }
  };
  g.__nidaaScheduler = setInterval(tick, 15 * 60_000);
  g.__nidaaScheduler.unref?.();
}
