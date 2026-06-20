"use client";

import { Filter, Search } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { FilterChip } from "@/components/shared/exchange/filter-chip";
import { UnderlineTab } from "@/components/shared/exchange/underline-tab";
import type {
  ReleaseAnalyticsChipPreset,
  ReleaseRowGenre,
  ReleaseRowStatus,
} from "@/types/analytics/releases";

export function ReleaseAnalyticsFiltersToolbar({
  statusTab,
  onStatusTab,
  chipPreset,
  onChipPreset,
  query,
  onQuery,
  genre,
  onGenre,
}: {
  statusTab: "all" | ReleaseRowStatus;
  onStatusTab: (t: "all" | ReleaseRowStatus) => void;
  chipPreset: ReleaseAnalyticsChipPreset;
  onChipPreset: (p: ReleaseAnalyticsChipPreset) => void;
  query: string;
  onQuery: (q: string) => void;
  genre: "all" | ReleaseRowGenre;
  onGenre: (g: "all" | ReleaseRowGenre) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="sticky top-0 z-[60] shrink-0 bg-black/90 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[1400px] space-y-2 px-4 py-2 md:px-6 lg:px-8">
        <div className="flex min-h-9 flex-wrap items-end gap-x-5 gap-y-1">
          <UnderlineTab tone="neutral" active={statusTab === "all"} onClick={() => onStatusTab("all")}>
            Все релизы
          </UnderlineTab>
          <UnderlineTab tone="neutral" active={statusTab === "Active"} onClick={() => onStatusTab("Active")}>
            Активные
          </UnderlineTab>
          <UnderlineTab tone="neutral" active={statusTab === "Paused"} onClick={() => onStatusTab("Paused")}>
            Пауза
          </UnderlineTab>
          <UnderlineTab tone="neutral" active={statusTab === "Closed"} onClick={() => onStatusTab("Closed")}>
            Закрыты
          </UnderlineTab>
        </div>

        <div className="flex min-h-10 flex-col gap-2 py-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip tone="neutral" active={chipPreset === "all"} onClick={() => onChipPreset("all")}>
              Все
            </FilterChip>
            <FilterChip tone="neutral" active={chipPreset === "top"} onClick={() => onChipPreset("top")}>
              Топ доходность
            </FilterChip>
            <FilterChip tone="neutral" active={chipPreset === "stable"} onClick={() => onChipPreset("stable")}>
              Стабильные
            </FilterChip>
            <FilterChip tone="neutral" active={chipPreset === "growth"} onClick={() => onChipPreset("growth")}>
              С ростом
            </FilterChip>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative min-w-[220px] sm:w-[260px]">
              <Search className="pointer-events-none absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
              <input
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder={t("analytics.releases.searchPlaceholder")}
                className="h-8 w-full border-0 border-b border-white/10 bg-transparent py-1.5 pl-6 pr-1 font-mono text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/25"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 font-mono text-[11px] font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            >
              <Filter className="size-3.5 text-zinc-500" aria-hidden />
              Фильтр
            </button>
          </div>
        </div>

        <div className="flex min-h-9 flex-wrap items-center gap-1.5 pb-1">
          <FilterChip tone="neutral" active={genre === "all"} onClick={() => onGenre("all")}>
            Все жанры
          </FilterChip>
          <FilterChip tone="neutral" active={genre === "electronic"} onClick={() => onGenre("electronic")}>
            Electronic
          </FilterChip>
          <FilterChip tone="neutral" active={genre === "hiphop"} onClick={() => onGenre("hiphop")}>
            Hip-hop
          </FilterChip>
          <FilterChip tone="neutral" active={genre === "pop"} onClick={() => onGenre("pop")}>
            Pop
          </FilterChip>
        </div>
      </div>
    </div>
  );
}
