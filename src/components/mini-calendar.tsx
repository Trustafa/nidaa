"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "./icons";
import { PenCircle } from "./ink";

type Props = {
  /** ISO yyyy-mm-dd for "today" (passed from the server to keep render stable) */
  today: string;
  /** ISO dates that have an event, with a label for the tooltip */
  eventDates: { date: string; label: string }[];
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** A pocket-diary month: event days ringed in pen, today underlined */
export function MiniCalendar({ today, eventDates }: Props) {
  const [y0, m0] = today.split("-").map(Number);
  const [view, setView] = useState({ year: y0, month: m0 - 1 });

  const monthName = new Date(Date.UTC(view.year, view.month, 1)).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const lead = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const eventsByDate = new Map(eventDates.map((e) => [e.date, e.label]));
  const monthEvents = eventDates
    .filter((e) => e.date.startsWith(iso(view.year, view.month, 1).slice(0, 7)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shift = (delta: number) =>
    setView(({ year, month }) => {
      const m = month + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });

  return (
    <section aria-label="Calendar">
      <div className="flex items-center justify-between border-b border-ink/80 pb-2">
        <h2 className="text-lg font-bold tracking-[-0.01em]">{monthName}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} aria-hidden className="pb-1 text-xs font-semibold text-ink-faint">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`x${i}`} />;
          const date = iso(view.year, view.month, day);
          const isToday = date === today;
          const eventLabel = eventsByDate.get(date);
          return (
            <span key={date} className="flex h-10 items-center justify-center">
              <span
                title={eventLabel}
                className={`tnum relative flex size-9 items-center justify-center text-sm ${
                  eventLabel ? "font-bold text-brand-700" : isToday ? "font-bold text-ink" : "text-ink-muted"
                }`}
              >
                {day}
                {eventLabel && <PenCircle />}
                {isToday && <span aria-hidden className="absolute bottom-1 h-0.5 w-4 rounded-full bg-margin" />}
              </span>
            </span>
          );
        })}
      </div>

      {monthEvents.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          {monthEvents.map((e) => (
            <li key={e.date + e.label} className="flex gap-3">
              <span className="tnum w-6 shrink-0 text-right font-hand text-base font-bold text-brand-600">
                {Number(e.date.slice(8))}
              </span>
              <span className="text-ink">{e.label}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
