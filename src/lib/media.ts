/**
 * Invitation photos and videos. With a database the bytes live in Postgres
 * (nidaa_media_files) and `.data/media/` is only a local cache, so hosts with
 * throwaway disks (Railway) lose nothing on redeploy. Without one, the local
 * folder is the only copy. WhatsApp gets its own copy at send time (see
 * ensureWhatsAppMedia in rsvp.ts), so no public URL is ever needed.
 *
 * Limits are WhatsApp's: images JPEG/PNG up to 5 MB, video MP4/3GPP up to
 * 16 MB (H.264 video with AAC audio).
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { MediaAsset, MediaKind } from "./types";
import { addMedia } from "./store";
import { loadMediaBytes, persistenceEnabled, saveMediaBytes } from "./persist";

const MB = 1024 * 1024;

export const MEDIA_RULES: Record<MediaKind, { types: Record<string, string>; maxBytes: number }> = {
  image: { types: { "image/jpeg": "jpg", "image/png": "png" }, maxBytes: 5 * MB },
  video: { types: { "video/mp4": "mp4", "video/3gpp": "3gp" }, maxBytes: 16 * MB },
};

export const MEDIA_ACCEPT = Object.values(MEDIA_RULES)
  .flatMap((r) => Object.keys(r.types))
  .join(",");

const MEDIA_DIR = path.join(process.cwd(), ".data", "media");

function extensionOf(asset: Pick<MediaAsset, "kind" | "mimeType">) {
  return MEDIA_RULES[asset.kind].types[asset.mimeType] ?? "bin";
}

/** Where this asset is cached on this server (paths aren't stable across hosts) */
function localPath(asset: Pick<MediaAsset, "id" | "kind" | "mimeType">) {
  return path.join(MEDIA_DIR, `${asset.id}.${extensionOf(asset)}`);
}

/** Path to a local copy of the file, fetching it from the database if needed; null if it's gone */
export async function mediaFile(asset: MediaAsset): Promise<string | null> {
  const file = localPath(asset);
  try {
    await access(file);
    return file;
  } catch {
    if (!persistenceEnabled()) return null;
  }
  const bytes = await loadMediaBytes(asset.id);
  if (!bytes) return null;
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(file, bytes);
  return file;
}

export async function readMedia(asset: MediaAsset) {
  const file = await mediaFile(asset);
  if (!file) throw new MediaError(`The file for “${asset.fileName}” is missing. Upload it again.`);
  return readFile(file);
}

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
  const filePath = localPath({ id, kind, mimeType: file.type });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (persistenceEnabled()) await saveMediaBytes(id, file.type, bytes);
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(filePath, bytes);

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
