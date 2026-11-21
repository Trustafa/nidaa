"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { MarginMark } from "./ink";

type Tone = "success" | "error";
type Toast = { id: number; text: string; tone: Tone };

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const toneStyles: Record<Tone, { mark: "attending" | "invalid" }> = {
  success: { mark: "attending" },
  error: { mark: "invalid" },
};

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((text: string, tone: Tone = "success") => {
    const id = ++seq;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 8000 : 4500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[var(--z-toast)] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end md:bottom-24"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-md bg-bg px-4 py-3 text-[0.9375rem] text-ink shadow-[0_6px_18px_-6px_oklch(0.25_0.08_262/0.35)] animate-[toast-in_240ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            <MarginMark status={toneStyles[t.tone].mark} className="mt-0.5 size-5 shrink-0" />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
