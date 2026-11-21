import type { MediaAsset } from "./types";

/** What the browser may know about a stored asset: no file paths or WhatsApp ids */
export function publicMedia(asset: MediaAsset | null | undefined) {
  return asset
    ? { id: asset.id, kind: asset.kind, url: `/api/media/${asset.id}`, fileName: asset.fileName, size: asset.size }
    : null;
}
