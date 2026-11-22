import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { getSessionUser } from "@/lib/auth";
import { mediaFile } from "@/lib/media";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { getMedia } from "@/lib/store";

/** Serve a stored photo or video, with byte ranges so videos can seek */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return new Response("Sign in first", { status: 401 });
  const { id } = await params;
  const asset = getMedia(id);
  const file = asset && (await mediaFile(asset));
  if (!asset || !file) return new Response("Not found", { status: 404 });
  const size = (await stat(file)).size;

  const headers = {
    "Content-Type": asset.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${size}` },
    });
  }

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
