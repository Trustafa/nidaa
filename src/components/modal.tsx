"use client";

import { useEffect, useRef } from "react";

type Props = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Wider layout for previews and tables */
  wide?: boolean;
};

/**
 * Native <dialog> opened modally: focus trapping, Escape and the inert
 * background come from the browser.
 */
export function Modal({ title, description, onClose, children, wide = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Clicks on the backdrop land on the dialog element itself
        if (e.target === ref.current) onClose();
      }}
      className={`z-[var(--z-modal)] m-auto w-[calc(100%-2rem)] ${
        wide ? "max-w-2xl" : "max-w-md"
      } rounded-lg border-0 bg-bg p-0 text-ink shadow-[0_24px_48px_-16px_oklch(0.25_0.08_262/0.45)] backdrop:bg-cover-deep/45 open:animate-[modal-in_180ms_cubic-bezier(0.22,1,0.36,1)]`}
    >
      <div className="max-h-[85dvh] overflow-y-auto px-6 pt-6 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-xl font-bold tracking-[-0.015em]">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="mt-1 text-[0.9375rem] text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
          >
            <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-4">
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
