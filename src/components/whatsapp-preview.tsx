import type { MediaKind } from "@/lib/types";

/**
 * How a template message will look on the guest's phone: an optional photo or
 * video, the body text, then the quick-reply buttons stacked under the bubble,
 * as WhatsApp renders them.
 */
export function WhatsAppPreview({
  text,
  buttons,
  caption,
  media,
}: {
  text: string;
  buttons: string[];
  caption?: string;
  media?: { kind: MediaKind; url: string } | null;
}) {
  return (
    <figure className="chat-surface rounded-lg p-4">
      <div className="max-w-[18rem]">
        <div className="rounded-lg rounded-tl-sm bg-bg shadow-wa">
          {media && (
            <div className="p-1 pb-0">
              {media.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt="Invitation photo" className="max-h-72 w-full rounded-md object-cover" />
              ) : (
                <video src={media.url} controls playsInline preload="metadata" className="max-h-72 w-full rounded-md bg-ink" />
              )}
            </div>
          )}
          <div className="px-3 py-2">
            <p className="whitespace-pre-wrap text-[0.9375rem] leading-[1.35] text-ink">{text}</p>
            <p className="mt-1 text-right text-[0.6875rem] text-ink-faint">now</p>
          </div>
        </div>
        <div className="mt-1 flex flex-col gap-1">
          {buttons.map((b) => (
            <span
              key={b}
              className="rounded-lg bg-bg px-3 py-2 text-center text-sm font-medium text-wa-button shadow-wa"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
      {caption && <figcaption className="mt-3 text-sm text-ink-muted">{caption}</figcaption>}
    </figure>
  );
}
