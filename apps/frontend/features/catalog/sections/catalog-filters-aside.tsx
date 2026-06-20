"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, SlidersHorizontal } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import {
  useCatalogKindOptions,
  useCatalogPhaseOptions,
  useCatalogSortOptions,
} from "@/hooks/use-catalog-i18n";
import { tf } from "@/lib/i18n/financial-messages";
import { intlLocaleFor } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";
import type { CatalogSearchSuggestionItem } from "@/types/catalog/page";
import type { CatalogFundingPhase, CatalogKindFilter, CatalogSortKey } from "@/types/catalog/page";

import type { CatalogActiveFilter } from "../hooks/use-catalog-active-filters";
import { CatalogActiveFilterChips } from "../ui/catalog-active-filter-chips";
import { CatalogGenreFilterSection } from "../ui/catalog-genre-filter-section";
import { CatalogSearchInput } from "../ui/catalog-search-input";

const sectionTitle =
  "mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500";

const rowClass = "flex flex-wrap gap-2";

const baseChip =
  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-[12px] font-medium tracking-[0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20";

const idleChip =
  "bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100";

const activeChip = "bg-white text-black shadow-[0_6px_20px_rgba(0,0,0,0.3)]";

const ghostButton =
  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200";

function normalizeMarketNumber(value: string): string {
  return value.replace(/[^\d,.\s]/g, "").replace(/\s+/g, " ").trim();
}

function formatMarketNumber(value: string, locale: import("@/lib/i18n/types").AppLocale): string {
  const normalized = normalizeMarketNumber(value).replace(/\s/g, "").replace(",", ".");
  if (!normalized) return "";
  const numeric = Number.parseFloat(normalized);
  if (!Number.isFinite(numeric)) return "";
  return new Intl.NumberFormat(intlLocaleFor(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function FilterSection({
  title,
  children,
  muted = false,
}: {
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={cn("px-1 py-1", muted && "opacity-45")}>
      <p className={sectionTitle}>{title}</p>
      {children}
    </section>
  );
}

function FiltersPanel({
  query,
  onQuery,
  onSelectSuggestion,
  kind,
  onKind,
  phase,
  onPhase,
  genre,
  onGenre,
  genres,
  genreCounts,
  sort,
  onSort,
  minPrice,
  onMinPrice,
  maxPrice,
  onMaxPrice,
  minProgress,
  onMinProgress,
  minYield,
  onMinYield,
  minLiquidity,
  onMinLiquidity,
  priceLabel,
  activeFilters,
  onReset,
  liveMode,
  kindOptions,
  phaseOptions,
  sortOptions,
  t,
  locale,
}: {
  query: string;
  onQuery: (q: string) => void;
  onSelectSuggestion: (item: CatalogSearchSuggestionItem) => void;
  kind: CatalogKindFilter;
  onKind: (k: CatalogKindFilter) => void;
  phase: CatalogFundingPhase;
  onPhase: (p: CatalogFundingPhase) => void;
  genre: string;
  onGenre: (g: string) => void;
  genres: string[];
  genreCounts: Map<string, number>;
  sort: CatalogSortKey;
  onSort: (s: CatalogSortKey) => void;
  minPrice: string;
  onMinPrice: (value: string) => void;
  maxPrice: string;
  onMaxPrice: (value: string) => void;
  minProgress: string;
  onMinProgress: (value: string) => void;
  minYield: string;
  onMinYield: (value: string) => void;
  minLiquidity: string;
  onMinLiquidity: (value: string) => void;
  priceLabel: string;
  onReset: () => void;
  liveMode: boolean;
  kindOptions: { id: CatalogKindFilter; label: string }[];
  phaseOptions: { id: CatalogFundingPhase; label: string }[];
  sortOptions: { id: CatalogSortKey; label: string }[];
  t: (key: string) => string;
  locale: import("@/lib/i18n/types").AppLocale;
  activeFilters: CatalogActiveFilter[];
}) {
  const phaseLocked = kind === "market";

  return (
    <div className="space-y-2">
      <section className="px-1 py-1">
        {liveMode ? (
          <CatalogSearchInput
            value={query}
            onChange={onQuery}
            onSelectSuggestion={onSelectSuggestion}
            liveMode
          />
        ) : (
          <CatalogSearchInput
            value={query}
            onChange={onQuery}
            onSelectSuggestion={(item) => onQuery(item.value)}
            liveMode={false}
          />
        )}

        {activeFilters.length > 0 ? (
          <div className="mt-3 max-h-28 overflow-y-auto pr-1 Spliton-scrollbar">
            <CatalogActiveFilterChips filters={activeFilters} onReset={onReset} />
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-zinc-600">{t("catalog.filters.noActive")}</p>
        )}
      </section>

      <FilterSection title={priceLabel}>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={minPrice}
            onChange={(e) => onMinPrice(normalizeMarketNumber(e.target.value))}
            onBlur={(e) => onMinPrice(formatMarketNumber(e.target.value, locale))}
            placeholder={t("catalog.filters.priceFrom")}
            className="h-11 rounded-xl bg-black/30 px-3 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-white/20"
          />
          <input
            type="text"
            inputMode="decimal"
            value={maxPrice}
            onChange={(e) => onMaxPrice(normalizeMarketNumber(e.target.value))}
            onBlur={(e) => onMaxPrice(formatMarketNumber(e.target.value, locale))}
            placeholder={t("catalog.filters.priceTo")}
            className="h-11 rounded-xl bg-black/30 px-3 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-white/20"
          />
        </div>
      </FilterSection>

      <FilterSection title={t("catalog.filters.section.type")}>
        <div className={rowClass}>
          {kindOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onKind(o.id)}
              className={cn(baseChip, kind === o.id ? activeChip : idleChip)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t("catalog.filters.section.status")} muted={phaseLocked}>
        <div className={rowClass} aria-disabled={phaseLocked}>
          {phaseOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={phaseLocked}
              onClick={() => onPhase(o.id)}
              className={cn(baseChip, phase === o.id ? activeChip : idleChip, phaseLocked && "pointer-events-none")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <CatalogGenreFilterSection
        genre={genre}
        onGenre={onGenre}
        genres={genres}
        genreCounts={genreCounts}
      />

      <FilterSection title={t("catalog.filters.section.sort")}>
        <div className={rowClass}>
          {sortOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onSort(o.id)}
              className={cn(baseChip, sort === o.id ? activeChip : idleChip)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {kind !== "market" ? (
        <>
          <FilterSection title={t("catalog.filters.section.progress")}>
            <input
              type="text"
              inputMode="decimal"
              value={minProgress}
              onChange={(e) => onMinProgress(normalizeMarketNumber(e.target.value))}
              onBlur={(e) => onMinProgress(formatMarketNumber(e.target.value, locale))}
              placeholder={t("catalog.filters.placeholder.minProgress")}
              className="h-11 w-full rounded-xl bg-black/30 px-3 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-white/20"
            />
          </FilterSection>

          <FilterSection title={t("catalog.filters.section.yield")}>
            <input
              type="text"
              inputMode="decimal"
              value={minYield}
              onChange={(e) => onMinYield(normalizeMarketNumber(e.target.value))}
              onBlur={(e) => onMinYield(formatMarketNumber(e.target.value, locale))}
              placeholder={t("catalog.filters.placeholder.minYield")}
              className="h-11 w-full rounded-xl bg-black/30 px-3 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-white/20"
            />
          </FilterSection>
        </>
      ) : (
        <FilterSection title={t("catalog.filters.section.liquidity")}>
          <input
            type="text"
            inputMode="decimal"
            value={minLiquidity}
            onChange={(e) => onMinLiquidity(normalizeMarketNumber(e.target.value))}
            onBlur={(e) => onMinLiquidity(formatMarketNumber(e.target.value, locale))}
            placeholder={t("catalog.filters.placeholder.minLiquidity")}
            className="h-11 w-full rounded-xl bg-black/30 px-3 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-white/20"
          />
        </FilterSection>
      )}
    </div>
  );
}

export function CatalogFiltersAside(props: {
  query: string;
  onQuery: (q: string) => void;
  onSelectSuggestion: (item: CatalogSearchSuggestionItem) => void;
  kind: CatalogKindFilter;
  onKind: (k: CatalogKindFilter) => void;
  phase: CatalogFundingPhase;
  onPhase: (p: CatalogFundingPhase) => void;
  genre: string;
  onGenre: (g: string) => void;
  genres: string[];
  genreCounts: Map<string, number>;
  sort: CatalogSortKey;
  onSort: (s: CatalogSortKey) => void;
  minPrice: string;
  onMinPrice: (value: string) => void;
  maxPrice: string;
  onMaxPrice: (value: string) => void;
  minProgress: string;
  onMinProgress: (value: string) => void;
  minYield: string;
  onMinYield: (value: string) => void;
  minLiquidity: string;
  onMinLiquidity: (value: string) => void;
  priceLabel: string;
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
  liveMode: boolean;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  activeFilters: CatalogActiveFilter[];
}) {
  const {
    query,
    onQuery,
    onSelectSuggestion,
    kind,
    onKind,
    phase,
    onPhase,
    genre,
    onGenre,
    genres,
    genreCounts,
    sort,
    onSort,
    minPrice,
    onMinPrice,
    maxPrice,
    onMaxPrice,
    minProgress,
    onMinProgress,
    minYield,
    onMinYield,
    minLiquidity,
    onMinLiquidity,
    priceLabel,
    filteredCount,
    totalCount,
    onReset,
    liveMode,
    mobileOpen,
    onMobileOpenChange,
    activeFilters,
  } = props;

  const { t, locale } = useI18n();
  const kindOptions = useCatalogKindOptions();
  const phaseOptions = useCatalogPhaseOptions();
  const sortOptions = useCatalogSortOptions();

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const panelProps = {
    query,
    onQuery,
    onSelectSuggestion,
    kind,
    onKind,
    phase,
    onPhase,
    genre,
    onGenre,
    genres,
    genreCounts,
    sort,
    onSort,
    minPrice,
    onMinPrice,
    maxPrice,
    onMaxPrice,
    minProgress,
    onMinProgress,
    minYield,
    onMinYield,
    minLiquidity,
    onMinLiquidity,
    priceLabel,
    activeFilters,
    onReset,
    liveMode,
    kindOptions,
    phaseOptions,
    sortOptions,
    t,
    locale,
  };

  return (
    <>
      {mobileOpen ? (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label={t("catalog.filters.closeAria")}
            onClick={() => onMobileOpenChange?.(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-3xl bg-[#050505] shadow-2xl">
            <div className="flex shrink-0 flex-col items-center pt-2.5 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" aria-hidden />
            </div>
            <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-2.5">
              <div>
                <p className="text-base font-semibold text-white">{t("catalog.filters.title")}</p>
                <p className="text-[11px] text-zinc-500">
                  {tf(t("catalog.filters.countOf"), {
                    filtered: String(filteredCount),
                    total: String(totalCount),
                  })}
                </p>
              </div>
              <button type="button" onClick={onReset} className={ghostButton}>
                <RotateCcw className="size-3.5" />
                {t("catalog.filters.reset")}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 Spliton-scrollbar">
              <FiltersPanel {...panelProps} />
            </div>
            <div className="shrink-0 border-t border-white/8 bg-[#050505] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98]"
                onClick={() => onMobileOpenChange?.(false)}
              >
                {tf(t("catalog.filters.showResults"), { count: String(filteredCount) })}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <aside
        className={cn(
          "hidden w-full shrink-0 flex-col bg-[#050505] text-[13px] text-white lg:flex",
          "lg:h-full lg:w-[430px] lg:min-w-[380px] lg:max-w-[460px]",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-4 pb-3 pt-4 sm:px-5">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-white/4">
                <SlidersHorizontal className="size-4 text-zinc-200" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[18px] font-semibold tracking-tight text-white">{t("catalog.filters.title")}</p>
                <p className="text-[11px] text-zinc-500">
                  {tf(t("catalog.filters.countOf"), {
                    filtered: String(filteredCount),
                    total: String(totalCount),
                  })}
                </p>
              </div>
            </div>
            <button type="button" onClick={onReset} className={ghostButton}>
              <RotateCcw className="size-3.5" strokeWidth={1.9} aria-hidden />
              {t("catalog.filters.reset")}
            </button>
          </div>
          <div className="Spliton-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
            <FiltersPanel {...panelProps} />
          </div>
          <div className="px-4 pb-4 pt-2 sm:px-5">
            <div className="text-center">
              <Link
                href="/assets/unt"
                className="inline-flex items-center justify-center font-sans text-[11px] font-medium text-zinc-500 transition hover:text-zinc-200"
              >
                {t("catalog.filters.untLink")}
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
