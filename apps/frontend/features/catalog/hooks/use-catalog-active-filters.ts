"use client";

import { useMemo } from "react";

import {
  useCatalogKindOptions,
  useCatalogPhaseOptions,
  useCatalogSortOptions,
} from "@/hooks/use-catalog-i18n";
import { tf } from "@/lib/i18n/financial-messages";
import { intlLocaleFor } from "@/lib/i18n/formatters";
import type { AppLocale } from "@/lib/i18n/types";
import type { CatalogFundingPhase, CatalogKindFilter, CatalogSortKey } from "@/types/catalog/page";

export type CatalogActiveFilter = {
  id: string;
  label: string;
  onClear: () => void;
};

function normalizeMarketNumber(value: string): string {
  return value.replace(/[^\d,.\s]/g, "").replace(/\s+/g, " ").trim();
}

function formatMarketNumber(value: string, locale: AppLocale): string {
  const normalized = normalizeMarketNumber(value).replace(/\s/g, "").replace(",", ".");
  if (!normalized) return "";
  const numeric = Number.parseFloat(normalized);
  if (!Number.isFinite(numeric)) return "";
  return new Intl.NumberFormat(intlLocaleFor(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function useCatalogActiveFilters({
  query,
  kind,
  phase,
  genre,
  sort,
  minPrice,
  maxPrice,
  minProgress,
  minYield,
  minLiquidity,
  onQuery,
  onKind,
  onPhase,
  onGenre,
  onSort,
  onMinPrice,
  onMaxPrice,
  onMinProgress,
  onMinYield,
  onMinLiquidity,
  locale,
  t,
}: {
  query: string;
  kind: CatalogKindFilter;
  phase: CatalogFundingPhase;
  genre: string;
  sort: CatalogSortKey;
  minPrice: string;
  maxPrice: string;
  minProgress: string;
  minYield: string;
  minLiquidity: string;
  onQuery: (value: string) => void;
  onKind: (value: CatalogKindFilter) => void;
  onPhase: (value: CatalogFundingPhase) => void;
  onGenre: (value: string) => void;
  onSort: (value: CatalogSortKey) => void;
  onMinPrice: (value: string) => void;
  onMaxPrice: (value: string) => void;
  onMinProgress: (value: string) => void;
  onMinYield: (value: string) => void;
  onMinLiquidity: (value: string) => void;
  locale: AppLocale;
  t: (key: string) => string;
}): CatalogActiveFilter[] {
  const kindOptions = useCatalogKindOptions();
  const phaseOptions = useCatalogPhaseOptions();
  const sortOptions = useCatalogSortOptions();

  return useMemo(() => {
    const filters: CatalogActiveFilter[] = [];

    if (kind !== "all") {
      filters.push({
        id: "kind",
        label: kindOptions.find((o) => o.id === kind)?.label ?? kind,
        onClear: () => onKind("all"),
      });
    }
    if (kind !== "market" && phase !== "all") {
      filters.push({
        id: "phase",
        label: phaseOptions.find((o) => o.id === phase)?.label ?? phase,
        onClear: () => onPhase("all"),
      });
    }
    if (genre) {
      filters.push({ id: "genre", label: genre, onClear: () => onGenre("") });
    }
    if (sort !== "catalog_order") {
      filters.push({
        id: "sort",
        label: sortOptions.find((o) => o.id === sort)?.label ?? sort,
        onClear: () => onSort("catalog_order"),
      });
    }
    if (minPrice.trim()) {
      filters.push({
        id: "minPrice",
        label: tf(t("catalog.filters.chip.priceFrom"), {
          value: formatMarketNumber(minPrice, locale) || minPrice.trim(),
        }),
        onClear: () => onMinPrice(""),
      });
    }
    if (maxPrice.trim()) {
      filters.push({
        id: "maxPrice",
        label: tf(t("catalog.filters.chip.priceTo"), {
          value: formatMarketNumber(maxPrice, locale) || maxPrice.trim(),
        }),
        onClear: () => onMaxPrice(""),
      });
    }
    if (minProgress.trim()) {
      filters.push({
        id: "minProgress",
        label: tf(t("catalog.filters.chip.progressFrom"), {
          value: formatMarketNumber(minProgress, locale) || minProgress.trim(),
        }),
        onClear: () => onMinProgress(""),
      });
    }
    if (minYield.trim()) {
      filters.push({
        id: "minYield",
        label: tf(t("catalog.filters.chip.yieldFrom"), {
          value: formatMarketNumber(minYield, locale) || minYield.trim(),
        }),
        onClear: () => onMinYield(""),
      });
    }
    if (minLiquidity.trim()) {
      filters.push({
        id: "minLiquidity",
        label: tf(t("catalog.filters.chip.liquidityFrom"), {
          value: formatMarketNumber(minLiquidity, locale) || minLiquidity.trim(),
        }),
        onClear: () => onMinLiquidity(""),
      });
    }
    if (query.trim()) {
      filters.push({
        id: "query",
        label: tf(t("catalog.filters.chip.search"), { value: query.trim() }),
        onClear: () => onQuery(""),
      });
    }

    return filters;
  }, [
    genre,
    kind,
    kindOptions,
    locale,
    maxPrice,
    minLiquidity,
    minPrice,
    minProgress,
    minYield,
    onGenre,
    onKind,
    onMaxPrice,
    onMinLiquidity,
    onMinPrice,
    onMinProgress,
    onMinYield,
    onPhase,
    onQuery,
    onSort,
    phase,
    phaseOptions,
    query,
    sort,
    sortOptions,
    t,
  ]);
}
