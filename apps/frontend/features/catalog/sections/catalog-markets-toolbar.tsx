"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { useCatalogKindOptions } from "@/hooks/use-catalog-i18n";
import { cn } from "@/lib/utils";
import type { CatalogKindFilter } from "@/types/catalog/page";

const GENRE_CHIPS = ["all", "Electronic", "Pop", "Indie", "Hip-Hop"] as const;

export function CatalogMarketsToolbar({
  kind,
  onKind,
  genre,
  onGenre,
  onOpenSearch,
  onOpenFilters,
  activeFiltersCount = 0,
}: {
  kind: CatalogKindFilter;
  onKind: (k: CatalogKindFilter) => void;
  genre: string;
  onGenre: (g: string) => void;
  onOpenSearch?: () => void;
  onOpenFilters?: () => void;
  activeFiltersCount?: number;
}) {
  const { t } = useI18n();
  const kindOptions = useCatalogKindOptions();

  return (
    <div className="space-y-3 bg-black pb-3">
      <div className="flex min-h-9 items-center gap-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/catalog"
          className="inline-flex shrink-0 items-center border-b-2 border-white pb-2 text-[15px] font-semibold text-white"
        >
          {t("catalog.markets.tabCatalog")}
        </Link>
        <Link
          href="/catalog/market-overview"
          className="inline-flex shrink-0 items-center border-b-2 border-transparent pb-2 text-[15px] font-medium text-zinc-500 transition hover:text-zinc-300"
        >
          {t("catalog.markets.tabOverview")}
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {kindOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onKind(opt.id)}
              className={cn(
                "shrink-0 border-b-2 pb-2 text-[14px] font-medium transition-colors",
                kind === opt.id ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
          aria-label={t("catalog.search.placeholder")}
        >
          <Search className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onOpenFilters}
          className="relative flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label={t("catalog.filters.mobileButton")}
        >
          <SlidersHorizontal className="size-4" strokeWidth={1.75} />
          {activeFiltersCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#B7F500] text-[9px] font-bold text-black">
              {activeFiltersCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GENRE_CHIPS.map((chip) => {
          const active = chip === "all" ? !genre || genre === "all" : genre === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onGenre(chip === "all" ? "" : chip)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                active ? "bg-[#1a1a1a] text-white" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {chip === "all" ? t("catalog.markets.chipAll") : chip}
            </button>
          );
        })}
      </div>
    </div>
  );
}
