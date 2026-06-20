"use client";

import { Check, ChevronDown } from "@/lib/lucide";
import * as React from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import {
  MARKET_FILTER_GROUPS,
  type MarketFilterId,
} from "@/constants/market-overview/page";
import type { MarketOverviewFilters } from "@/hooks/use-market-overview-state";
import { cn } from "@/lib/utils";

function filterOptionLabel(t: (key: string) => string, groupId: MarketFilterId, value: string): string {
  if (value === "all") return t("marketOverview.filter.all");
  if (value === "any") return t("marketOverview.filter.payout.any");
  const key = `marketOverview.filter.${groupId}.${value}`;
  const translated = t(key);
  return translated !== key ? translated : value;
}

export function MarketOverviewFilters({
  filters,
  onChange,
}: {
  filters: MarketOverviewFilters;
  onChange: (id: keyof MarketOverviewFilters, value: string) => void;
}) {
  const { t } = useI18n();
  const [openId, setOpenId] = React.useState<MarketFilterId | null>(null);
  const rootsRef = React.useRef<Map<MarketFilterId, HTMLDivElement | null>>(new Map());

  React.useEffect(() => {
    if (!openId) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = rootsRef.current.get(openId);
      if (root && !root.contains(e.target as Node)) setOpenId(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [openId]);

  React.useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <div className="flex w-full flex-wrap items-stretch gap-2 md:gap-2.5">
      {MARKET_FILTER_GROUPS.map((group) => {
        const current = group.options.find((o) => o.value === filters[group.id]) ?? group.options[0];
        const isOpen = openId === group.id;

        return (
          <div
            key={group.id}
            ref={(el) => {
              rootsRef.current.set(group.id, el);
            }}
            className="relative"
          >
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-controls={isOpen ? `filter-list-${group.id}` : undefined}
              onClick={() => setOpenId((id) => (id === group.id ? null : group.id))}
              className={cn(
                "flex min-w-32 flex-col items-stretch gap-0.5 rounded-xl bg-white/4 px-3.5 py-2.5 text-left transition-colors",
                "hover:bg-white/7",
                isOpen && "bg-white/9",
              )}
            >
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {t(`marketOverview.filter.${group.id}`)}
              </span>
              <span className="inline-flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[13px] font-medium text-zinc-100">
                  {filterOptionLabel(t, group.id, current.value)}
                </span>
                <ChevronDown
                  className={cn("size-4 shrink-0 text-zinc-500 transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </span>
            </button>

            {isOpen ? (
              <ul
                id={`filter-list-${group.id}`}
                role="listbox"
                aria-label={t(`marketOverview.filter.${group.id}`)}
                className="absolute left-0 top-[calc(100%+6px)] z-70 min-w-full max-w-[min(100vw-2rem,18rem)] overflow-hidden rounded-xl bg-zinc-900/98 py-1 shadow-[0_20px_48px_-16px_rgba(0,0,0,0.75)] backdrop-blur-md"
              >
                {group.options.map((opt) => {
                  const active = filters[group.id] === opt.value;
                  return (
                    <li key={opt.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          onChange(group.id, opt.value);
                          setOpenId(null);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] transition-colors",
                          active
                            ? "bg-white/8 font-medium text-white"
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                        )}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          {active ? (
                            <Check className="size-3.5 shrink-0 text-zinc-300" strokeWidth={2.5} aria-hidden />
                          ) : (
                            <span className="size-3.5 shrink-0" aria-hidden />
                          )}
                          <span className="truncate">{filterOptionLabel(t, group.id, opt.value)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
