import type { NextRequest } from "next/server";
import { runScheduledReminders } from "@/lib/rsvp";
import { flush } from "@/lib/persist";

/**
 * Chasers and pre-event reminders. Call hourly from a scheduler with
 * `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this header for you).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : process.env.NODE_ENV !== "production";
  if (!authorized) return new Response("Unauthorized", { status: 401 });

  const result = await runScheduledReminders();
  await flush();
  return Response.json(result);
}
