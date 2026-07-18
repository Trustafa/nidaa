"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "./icons";

type Props = {
  /** ISO yyyy-mm-dd for "today" (passed from the server to keep render stable) */
  today: string;
  /** ISO dates that have an event, with a label for the tooltip */
  eventDates: { date: string; label: string }[];
};

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function MiniCalendar({ today, eventDates }: Props) {
  const [y0, m0] = today.split("-").map(Number);
  const [view, setView] = useState({ year: y0, month: m0 - 1 });

  const monthName = new Date(view.year, view.month, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(view.year, view.month, 1);
  // Monday-first offset
  const lead = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const eventsByDate = new Map(eventDates.map((e) => [e.date, e.label]));

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () =>
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  const next = () =>
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  return (
    <div className="rounded-xl border border-line bg-bg p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous month"
          className="flex size-7 items-center justify-center rounded-md text-ink-faint transition-colors duration-150 hover:bg-surface hover:text-ink"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span className="text-sm font-semibold">{monthName}</span>
        <button
          type="button"
          onClick={next}
          aria-label="Next month"
          className="flex size-7 items-center justify-center rounded-md text-ink-faint transition-colors duration-150 hover:bg-surface hover:text-ink"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1.5 text-[0.6875rem] font-medium text-ink-faint">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`x${i}`} />;
          const date = iso(view.year, view.month, day);
          const isToday = date === today;
          const eventLabel = eventsByDate.get(date);
          return (
            <span key={date} className="relative flex h-8 items-center justify-center">
              <span
                title={eventLabel}
                className={`tnum flex size-7 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-brand-600 font-semibold text-white"
                    : eventLabel
                      ? "bg-brand-050 font-medium text-brand-700"
                      : "text-ink-muted"
                }`}
              >
                {day}
              </span>
              {eventLabel && !isToday && (
                <span
                  aria-hidden
                  className="absolute bottom-0.5 size-1 rounded-full bg-brand-500"
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
