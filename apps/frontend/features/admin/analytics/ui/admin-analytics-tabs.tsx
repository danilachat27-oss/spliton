"use client";

import { cn } from "@/lib/utils";
import type { AnalyticsPageTab } from "@/features/admin/analytics/config/analytics-page-tabs";

type Props = {
  tabs: readonly AnalyticsPageTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function AdminAnalyticsTabs({ tabs, activeId, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap gap-1 border-b border-zinc-800/80 pb-px",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-[#B7F500] bg-zinc-900/80 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
