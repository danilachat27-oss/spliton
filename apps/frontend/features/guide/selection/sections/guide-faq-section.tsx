"use client";

import { Minus, Plus } from "@/lib/lucide";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import {
  buildGuideFaqGroups,
  guideFaqFilterOptions,
  type GuideFaqFilterId,
} from "@/lib/guide/guide-faq-content";
import { cn } from "@/lib/utils";

import { GuideSectionShell } from "../ui/guide-section-shell";

export function GuideFaqSection() {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<GuideFaqFilterId>("all");

  const filters = useMemo(() => guideFaqFilterOptions(locale), [locale]);
  const groups = useMemo(() => buildGuideFaqGroups(locale, filter), [locale, filter]);
  const showGroupHeaders = filter === "all";

  return (
    <GuideSectionShell id="faq" title={t("guide.faq.title")} subtitle={t("guide.faq.subtitle")} headerAlign="left">
      <nav aria-label={t("guide.faq.title")} className="flex flex-wrap gap-x-4 gap-y-2">
        {filters.map((option) => {
          const isActive = filter === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "text-[12px] font-medium underline underline-offset-[3px] transition-colors",
                isActive
                  ? "text-[#d4f570] decoration-[#B7F500]/40"
                  : "text-zinc-500 decoration-transparent hover:text-zinc-300 hover:decoration-white/20",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 space-y-4">
        {groups.length === 0 ? (
          <p className="rounded-xl bg-[#111111] py-6 text-center text-sm text-zinc-500">{t("guide.faq.empty")}</p>
        ) : (
          groups.map((group) => (
            <div key={group.category}>
              {showGroupHeaders ? (
                <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {group.label}
                </h3>
              ) : null}
              <div className="space-y-2">
                {group.items.map((item) => (
                  <details
                    key={item.id}
                    className="group overflow-hidden rounded-xl bg-[#111111] [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-white/4 md:px-4 md:py-3.5">
                      <span className="min-w-0 flex-1">
                        {!showGroupHeaders ? (
                          <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                            {item.categoryLabel}
                          </span>
                        ) : null}
                        <span className="text-left text-[15px] font-medium leading-snug text-white md:text-base">
                          {item.q}
                        </span>
                      </span>
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-white transition-colors group-open:bg-[#B7F500]/14 group-open:text-[#d4f570]"
                        aria-hidden
                      >
                        <Plus className="size-4 group-open:hidden" strokeWidth={1.75} />
                        <Minus className="hidden size-4 group-open:block" strokeWidth={1.75} />
                      </span>
                    </summary>
                    <div className="border-t border-white/6 bg-[#0a0a0a] px-3 pb-3.5 pt-3 text-sm leading-relaxed text-zinc-300 md:px-4 md:pb-4 md:pt-3.5 md:text-[15px]">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </GuideSectionShell>
  );
}
