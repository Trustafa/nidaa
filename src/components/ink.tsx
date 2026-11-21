"use client";

import { useState } from "react";
import type { RsvpStatus } from "@/lib/types";

/**
 * The ballpoint layer: marks a host would make beside a name, drawn as single
 * pen strokes. One pen colour for every mark; the shape carries the meaning.
 */
type Stroke = { d: string; len: number };

const MARKS: Record<Exclude<RsvpStatus, "pending">, Stroke[]> = {
  attending: [{ d: "M3.2 10.6c1.6 1.4 3 3.2 4.4 5.2 2.3-4.6 5.4-8.8 9.4-12.3", len: 26 }],
  declined: [
    { d: "M4.4 4.6c3.6 3.6 7.4 7.4 11 11.2", len: 17 },
    { d: "M15.6 4.2c-3.8 3.8-7.6 7.7-11.3 11.9", len: 17 },
  ],
  maybe: [
    { d: "M6.4 7c0-2.6 2-3.8 4-3.6 2.4.3 3.6 2.6 2.4 4.6-.9 1.4-2.8 2-2.9 4.6", len: 16 },
    { d: "M9.9 16.3l.1.2", len: 1 },
  ],
  invalid: [
    { d: "M10.4 3.4c-.3 3.2-.2 6.3-.5 9.4", len: 10 },
    { d: "M9.8 16.3l.1.2", len: 1 },
  ],
};

/** Re-run the draw animation whenever the status actually changes after mount */
function useRedraw(status: RsvpStatus) {
  const [last, setLast] = useState(status);
  const [draws, setDraws] = useState(0);
  if (last !== status) {
    setLast(status);
    setDraws(draws + 1);
  }
  return draws;
}

export function MarginMark({ status, className = "size-5" }: { status: RsvpStatus; className?: string }) {
  const draws = useRedraw(status);
  if (status === "pending") return <span aria-hidden className={`inline-block ${className}`} />;
  return (
    <svg
      key={draws}
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-brand-600 ${draws ? "ink-draw" : ""} ${className}`}
    >
      {MARKS[status].map((s, i) => (
        <path
          key={i}
          d={s.d}
          className="ink-stroke"
          style={{ "--len": s.len + 2, "--delay": `${i * 160}ms` } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

/**
 * A number summed by hand at the foot of a column, underlined twice in pen.
 */
export function HandTotal({ value, className = "text-5xl" }: { value: number; className?: string }) {
  return (
    <span className={`relative inline-block px-1 font-hand font-bold leading-none text-brand-600 tnum ${className}`}>
      {value}
      <svg
        aria-hidden
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        className="absolute inset-x-0 -bottom-2.5 h-3 w-full"
      >
        <path d="M2 3.5c22-1.4 52-1.6 96-.4" vectorEffect="non-scaling-stroke" />
        <path d="M5 9c24-1.2 54-1.1 92 .3" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

/** A loose pen circle around a date, the way you'd ring it on a calendar */
export function PenCircle({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      className={`pointer-events-none absolute inset-0 size-full text-brand-500 ${className}`}
    >
      <path d="M24 5.5C15 3.6 5.6 9 5 19c-.6 9.6 7.6 16.2 16.4 15.6C30.8 34 36 26.4 34.6 17.8 33.4 10.6 26.6 6 19 6.8" />
    </svg>
  );
}
