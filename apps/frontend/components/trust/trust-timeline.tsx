"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type TrustTimelineEntry = {
  date: string;
  label: string;
  title: string;
  description: string;
};

type TrustTimelineProps = {
  heading: string;
  subheading?: string;
  entries: readonly TrustTimelineEntry[];
  defaultIndex?: number;
  className?: string;
};

export function TrustTimeline({ heading, subheading, entries, defaultIndex, className }: TrustTimelineProps) {
  const { t } = useI18n();
  const [active, setActive] = useState(defaultIndex ?? entries.length - 1);
  const current = entries[active]!;

  const go = (direction: -1 | 1) => {
    setActive((index) => Math.max(0, Math.min(entries.length - 1, index + direction)));
  };

  return (
    <section className={cn("rounded-3xl bg-white px-5 py-8 sm:px-8 sm:py-10", className)} aria-labelledby={heading}>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{heading}</h2>
        {subheading ? <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">{subheading}</p> : null}
      </div>

      <div className="relative mt-10 sm:mt-12">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={active === 0}
          className="absolute left-0 top-[4.25rem] z-10 hidden -translate-y-1/2 text-neutral-400 transition hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-25 sm:block"
          aria-label={t("trust.timeline.prev")}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={active === entries.length - 1}
          className="absolute right-0 top-[4.25rem] z-10 hidden -translate-y-1/2 text-neutral-400 transition hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-25 sm:block"
          aria-label={t("trust.timeline.next")}
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>

        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            className="relative mx-auto px-2 sm:px-10"
            style={{ minWidth: `min(100%, ${entries.length * 168}px)` }}
          >
            <div
              className="pointer-events-none absolute left-10 right-10 top-[4.5rem] border-t border-dashed border-neutral-300 sm:left-14 sm:right-14"
              aria-hidden
            />

            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))` }}
            >
              {entries.map((entry, index) => {
                const isActive = index === active;
                return (
                  <button
                    key={entry.label}
                    type="button"
                    onClick={() => setActive(index)}
                    className="group flex flex-col items-center px-1 text-center"
                  >
                    <span
                      className={cn(
                        "min-h-[3.25rem] max-w-[11rem] text-xs leading-snug sm:text-sm",
                        isActive ? "font-semibold text-neutral-900" : "text-neutral-500 group-hover:text-neutral-700",
                      )}
                    >
                      {isActive ? (
                        <span className="relative inline-block pb-1">
                          {entry.label}
                          <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#B7F500]" aria-hidden />
                        </span>
                      ) : (
                        entry.label
                      )}
                    </span>

                    <span
                      className={cn(
                        "relative z-[1] mt-6 size-3 shrink-0 rounded-full transition",
                        isActive ? "bg-neutral-900" : "bg-white outline outline-1 outline-neutral-900",
                      )}
                      aria-hidden
                    />

                    <span
                      className={cn(
                        "mt-3 text-xs sm:text-sm",
                        isActive ? "font-semibold text-neutral-900" : "text-neutral-500",
                      )}
                    >
                      {entry.date}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl text-center sm:mt-12">
        <p className="text-sm text-neutral-500">{current.date}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">{current.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{current.description}</p>
      </div>
    </section>
  );
}
