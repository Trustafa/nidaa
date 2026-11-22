import { persistenceEnabled, ping } from "@/lib/persist";

/** Railway's health check: the server is up and can reach the database */
export async function GET() {
  if (persistenceEnabled()) {
    try {
      await ping();
    } catch {
      return Response.json({ ok: false, database: "unreachable" }, { status: 503 });
    }
  }
  return Response.json({ ok: true, database: persistenceEnabled() ? "ok" : "none (practice data)" });
}
