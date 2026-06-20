"use client";

import { X } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

import type { CatalogActiveFilter } from "../hooks/use-catalog-active-filters";

export function CatalogActiveFilterChips({
  filters,
  onReset,
  className,
  compact = false,
}: {
  filters: CatalogActiveFilter[];
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();

  if (filters.length === 0) return null;

  return (
    <div
      className={cn("min-w-0", className)}
      role="region"
      aria-label={t("catalog.filters.activeFiltersAria")}
    >
      <div
        className={cn(
          "flex gap-2",
          compact ? "overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "flex-wrap",
        )}
      >
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={filter.onClear}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 text-zinc-300 transition hover:bg-white/10",
              compact ? "max-w-[220px] px-3 py-1.5 text-[11px] font-medium" : "px-3 py-1.5 text-[10px] font-medium",
            )}
          >
            <span className="truncate">{filter.label}</span>
            <X className="size-3 shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />
          </button>
        ))}
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border border-white/10 px-3 py-1.5 font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200",
              compact ? "text-[11px]" : "text-[10px]",
            )}
          >
            {t("catalog.filters.clearAll")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
