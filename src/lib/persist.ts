/**
 * Postgres persistence (Supabase in production).
 *
 * The app keeps its working set in memory (see store.ts) and writes every
 * change through to Postgres as JSON documents, one row per org / event /
 * guest / media asset. Reads never touch the database; it's loaded once at
 * startup (instrumentation.ts). That keeps the rest of the app synchronous and
 * unchanged, with one rule: run exactly ONE server instance, since a second
 * one wouldn't see the first one's memory.
 *
 * Writes are queued as entities change and flushed in order. Anything that
 * must be durable before replying (server actions, the webhook, the
 * scheduler) awaits flush().
 */
import { Pool, type PoolConfig } from "pg";

export type DocKind = "org" | "event" | "guest" | "media" | "inbound";

type Pending = { kind: DocKind; id: string; data: object | null };

type State = {
  pool: Pool | null;
  /** Everything this process has changed since it loaded (see changedSince) */
  touched: Set<string>;
  dirty: Map<string, Pending>;
  chain: Promise<void>;
  timer: ReturnType<typeof setTimeout> | null;
};

const g = globalThis as unknown as { __nidaaPersist?: State };

function state(): State {
  g.__nidaaPersist ??= { pool: null, touched: new Set(), dirty: new Map(), chain: Promise.resolve(), timer: null };
  return g.__nidaaPersist;
}

export function persistenceEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function poolConfig(): PoolConfig {
  const url = new URL(process.env.DATABASE_URL!);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  // Supabase's pooler presents a certificate chain Node doesn't ship the root
  // for; the connection is still encrypted. sslmode in the URL would override
  // this object, so it's stripped.
  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    ssl: local ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
}

export function pool(): Pool {
  const s = state();
  if (!s.pool) {
    s.pool = new Pool(poolConfig());
    s.pool.on("error", (e) => console.error("[db] idle client error", e));
  }
  return s.pool;
}

const SCHEMA = `
  create table if not exists nidaa_docs (
    kind text not null,
    id text not null,
    data jsonb not null,
    updated_at timestamptz not null default now(),
    primary key (kind, id)
  );
  create table if not exists nidaa_media_files (
    id text primary key,
    mime_type text not null,
    bytes bytea not null,
    created_at timestamptz not null default now()
  );
  alter table nidaa_docs enable row level security;
  alter table nidaa_media_files enable row level security;
`;

export type Doc = { kind: DocKind; id: string; data: unknown };

/** Creates the tables if needed and returns every stored document, plus the database clock */
export async function loadAll(): Promise<{ rows: Doc[]; at: string }> {
  const db = pool();
  await db.query(SCHEMA);
  const at = (await db.query<{ now: Date }>("select now()")).rows[0].now.toISOString();
  // Webhook dedupe ids only matter while Meta might still retry (7 days)
  await db.query(`delete from nidaa_docs where kind = 'inbound' and updated_at < now() - interval '14 days'`);
  const { rows } = await db.query<Doc>(
    `select kind, id, data from nidaa_docs where kind <> 'inbound' or updated_at > now() - interval '14 days'`
  );
  return { rows, at };
}

/**
 * Documents another process wrote after `since` that this process hasn't
 * touched itself. During a redeploy the old server keeps answering for a few
 * seconds after the new one has loaded; this picks up what it wrote.
 */
export async function changedSince(since: string): Promise<Doc[]> {
  const { rows } = await pool().query<Doc>(`select kind, id, data from nidaa_docs where updated_at > $1`, [since]);
  const touched = state().touched;
  return rows.filter((r) => !touched.has(`${r.kind}:${r.id}`));
}

/** Queue a write; `data` is read when the flush runs, so pass the live object. null deletes. */
export function markDirty(kind: DocKind, id: string, data: object | null) {
  if (!persistenceEnabled()) return;
  const s = state();
  s.touched.add(`${kind}:${id}`);
  s.dirty.set(`${kind}:${id}`, { kind, id, data });
  s.timer ??= setTimeout(() => {
    s.timer = null;
    flush().catch((e) => console.error("[db] background flush failed", e));
  }, 25);
}

async function writeBatch(batch: Pending[]) {
  const upserts = batch.filter((p) => p.data !== null);
  const deletes = batch.filter((p) => p.data === null);
  const client = await pool().connect();
  try {
    await client.query("begin");
    if (upserts.length) {
      await client.query(
        `insert into nidaa_docs (kind, id, data)
         select * from unnest($1::text[], $2::text[], $3::jsonb[])
         on conflict (kind, id) do update set data = excluded.data, updated_at = now()`,
        [upserts.map((p) => p.kind), upserts.map((p) => p.id), upserts.map((p) => JSON.stringify(p.data))]
      );
    }
    if (deletes.length) {
      await client.query(
        `delete from nidaa_docs d using unnest($1::text[], $2::text[]) as x(kind, id)
         where d.kind = x.kind and d.id = x.id`,
        [deletes.map((p) => p.kind), deletes.map((p) => p.id)]
      );
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Write everything queued so far. Resolves once it's in Postgres. */
export function flush(): Promise<void> {
  if (!persistenceEnabled()) return Promise.resolve();
  const s = state();
  const step = s.chain.then(async () => {
    if (!s.dirty.size) return;
    const batch = [...s.dirty.values()];
    s.dirty.clear();
    try {
      await writeBatch(batch);
    } catch (e) {
      // Put them back (unless changed again meanwhile) so the next flush retries
      for (const p of batch) {
        const key = `${p.kind}:${p.id}`;
        if (!s.dirty.has(key)) s.dirty.set(key, p);
      }
      throw e;
    }
  });
  // Keep the chain alive after a failure; the caller still sees the error
  s.chain = step.catch(() => {});
  return step;
}

/* ── Invitation media bytes ───────────────────────────────────────────── */

export async function saveMediaBytes(id: string, mimeType: string, bytes: Buffer) {
  await pool().query(
    `insert into nidaa_media_files (id, mime_type, bytes) values ($1, $2, $3)
     on conflict (id) do update set mime_type = excluded.mime_type, bytes = excluded.bytes`,
    [id, mimeType, bytes]
  );
}

export async function loadMediaBytes(id: string): Promise<Buffer | null> {
  const { rows } = await pool().query<{ bytes: Buffer }>(`select bytes from nidaa_media_files where id = $1`, [id]);
  return rows[0]?.bytes ?? null;
}

/** Cheap connectivity check for /api/health */
export async function ping() {
  await pool().query("select 1");
}
