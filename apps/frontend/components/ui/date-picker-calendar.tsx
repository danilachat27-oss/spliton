"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "@/lib/lucide";
import {
  buildCalendarMonth,
  monthLabel,
  parseIsoDate,
  toIsoDate,
  weekdayLabels,
} from "@/lib/date/calendar-utils";
import { cn } from "@/lib/utils";

type DatePickerCalendarProps = {
  value: string;
  onSelect: (iso: string) => void;
  locale?: string;
  className?: string;
};

export function DatePickerCalendar({
  value,
  onSelect,
  locale = "ru-RU",
  className,
}: DatePickerCalendarProps) {
  const selected = parseIsoDate(value);
  const initial = selected ?? new Date();
  const [viewYear, setViewYear] = React.useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initial.getMonth());

  React.useEffect(() => {
    const next = parseIsoDate(value);
    if (!next) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }, [value]);

  const cells = buildCalendarMonth(viewYear, viewMonth, value || undefined);
  const weekdays = weekdayLabels(locale);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <div className={cn("select-none", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          className="flex size-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="text-sm font-semibold capitalize text-zinc-100">
          {monthLabel(viewYear, viewMonth, locale)}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          className="flex size-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekdays.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => (
          <button
            key={cell.iso}
            type="button"
            onClick={() => onSelect(cell.iso)}
            className={cn(
              "flex h-10 items-center justify-center rounded-xl text-sm font-medium transition",
              cell.inCurrentMonth ? "text-zinc-200" : "text-zinc-600",
              cell.isSelected
                ? "bg-[#B7F500]/14 text-[#B7F500] ring-1 ring-inset ring-[#B7F500]/30"
                : "hover:bg-white/5",
              cell.isToday && !cell.isSelected && "ring-1 ring-inset ring-zinc-600",
            )}
          >
            {cell.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

export { toIsoDate };
