"use client";

import { useRef, useState } from "react";
import type { MediaKind } from "@/lib/types";
import { btnSecondarySm, btnDanger } from "./ui";

export type PublicMedia = { id: string; kind: MediaKind; url: string; fileName: string; size: number };

const ACCEPT = "image/jpeg,image/png,video/mp4,video/3gpp";
const LIMITS: Record<MediaKind, number> = { image: 5 * 1024 * 1024, video: 16 * 1024 * 1024 };

function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Pick a photo or video for the invitation. Uploads straight away (with
 * progress, since videos can be large on a phone connection) and hands the
 * form a hidden `mediaId`.
 */
export function MediaPicker({
  value,
  onChange,
  error,
}: {
  value: PublicMedia | null;
  onChange: (media: PublicMedia | null) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  function upload(file: File) {
    setProblem(null);
    const kind: MediaKind | null = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
    if (!kind || !ACCEPT.split(",").includes(file.type)) {
      setProblem("Use a JPG or PNG photo, or an MP4 video.");
      return;
    }
    if (file.size > LIMITS[kind]) {
      setProblem(kind === "image" ? "Photos can be up to 5 MB on WhatsApp." : "Videos can be up to 16 MB on WhatsApp. Try a shorter clip.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media");
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let res: Partial<PublicMedia> & { error?: string } = {};
      try {
        res = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && res.id) onChange(res as PublicMedia);
      else setProblem(res.error ?? "The upload didn't go through. Try again.");
    };
    xhr.onerror = () => {
      setProgress(null);
      setProblem("The upload didn't go through. Check your connection and try again.");
    };
    setProgress(0);
    xhr.send(body);
  }

  const shownError = problem ?? error;

  return (
    <div>
      <input type="hidden" name="mediaId" value={value?.id ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Choose a photo or video"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="flex items-center gap-4 border-y border-line py-3">
          <div className="size-20 shrink-0 overflow-hidden rounded-md bg-surface">
            {value.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.url} alt="" className="size-full object-cover" />
            ) : (
              <video src={value.url} muted playsInline preload="metadata" className="size-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] font-semibold">{value.fileName}</p>
            <p className="text-sm text-ink-muted">{`${value.kind === "image" ? "Photo" : "Video"} · ${sizeLabel(value.size)}`}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className={btnSecondarySm} disabled={progress !== null}>
                Replace
              </button>
              <button type="button" onClick={() => onChange(null)} className={`${btnDanger} min-h-9 py-1.5 text-sm`}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-control px-4 py-6 text-center transition-colors duration-150 hover:border-brand-500 hover:bg-brand-050 disabled:cursor-wait"
        >
          <span className="text-[0.9375rem] font-semibold text-brand-600">
            {progress === null ? "Add a photo or video" : `Uploading… ${progress}%`}
          </span>
          <span className="text-sm text-ink-muted">Your invitation card or a short clip. JPG or PNG up to 5 MB, MP4 up to 16 MB.</span>
        </button>
      )}

      {progress !== null && (
        <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress" className="mt-2 h-[3px] bg-line">
          <div className="h-full bg-brand-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      )}
      {shownError && <p className="mt-1.5 text-xs text-declined-ink">{shownError}</p>}
    </div>
  );
}
