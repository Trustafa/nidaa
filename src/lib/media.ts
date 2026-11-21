/**
 * Invitation photos and videos. Files are written to `.data/media/` on this
 * server and registered in the store; WhatsApp gets its own copy at send time
 * (see ensureWhatsAppMedia in rsvp.ts), so no public URL is ever needed.
 *
 * Limits are WhatsApp's: images JPEG/PNG up to 5 MB, video MP4/3GPP up to
 * 16 MB (H.264 video with AAC audio).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { MediaAsset, MediaKind } from "./types";
import { addMedia } from "./store";

const MB = 1024 * 1024;

export const MEDIA_RULES: Record<MediaKind, { types: Record<string, string>; maxBytes: number }> = {
  image: { types: { "image/jpeg": "jpg", "image/png": "png" }, maxBytes: 5 * MB },
  video: { types: { "video/mp4": "mp4", "video/3gpp": "3gp" }, maxBytes: 16 * MB },
};

export const MEDIA_ACCEPT = Object.values(MEDIA_RULES)
  .flatMap((r) => Object.keys(r.types))
  .join(",");

const MEDIA_DIR = path.join(process.cwd(), ".data", "media");

export function mediaKindOf(mimeType: string): MediaKind | null {
  for (const [kind, rule] of Object.entries(MEDIA_RULES) as [MediaKind, (typeof MEDIA_RULES)[MediaKind]][]) {
    if (mimeType in rule.types) return kind;
  }
  return null;
}

export class MediaError extends Error {}

export async function saveUpload(file: File): Promise<MediaAsset> {
  const kind = mediaKindOf(file.type);
  if (!kind) throw new MediaError("Use a JPG or PNG photo, or an MP4 video.");
  const rule = MEDIA_RULES[kind];
  if (file.size > rule.maxBytes) {
    throw new MediaError(
      kind === "image"
        ? "Photos can be up to 5 MB on WhatsApp. Try a smaller or more compressed image."
        : "Videos can be up to 16 MB on WhatsApp. Try a shorter clip or export at a lower quality."
    );
  }
  if (file.size === 0) throw new MediaError("That file is empty.");

  const id = randomUUID();
  const filePath = path.join(MEDIA_DIR, `${id}.${rule.types[file.type]}`);
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return addMedia({
    id,
    kind,
    mimeType: file.type,
    fileName: file.name.slice(0, 120) || `invitation.${rule.types[file.type]}`,
    size: file.size,
    path: filePath,
    uploadedAt: new Date().toISOString(),
  });
}
