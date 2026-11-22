/**
 * Runs once when the server starts, before it takes requests:
 *   1. loads the store from Postgres (when DATABASE_URL is set);
 *   2. starts the in-process scheduler: every 15 minutes it runs the same job
 *      as /api/cron/reminders, so queued invitations go out as WhatsApp's
 *      daily limit frees up without any external cron.
 *
 * Both assume ONE long-running server (`next start` on Railway). Set
 * NIDAA_SCHEDULER=off to disable the timer and call /api/cron/reminders
 * from an external scheduler instead.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { loadStore } = await import("./lib/store");
  await loadStore();

  if (process.env.NIDAA_SCHEDULER === "off") return;
  const g = globalThis as unknown as { __nidaaScheduler?: ReturnType<typeof setInterval> };
  if (g.__nidaaScheduler) return;

  const { runScheduledReminders } = await import("./lib/rsvp");
  const { flush } = await import("./lib/persist");
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const r = await runScheduledReminders();
      await flush();
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
