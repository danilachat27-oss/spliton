"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import type { CatalogFundingPhase, CatalogKindFilter, CatalogSortKey } from "@/types/catalog/page";

export function useCatalogKindOptions() {
  const { t } = useI18n();
  return useMemo(
    (): { id: CatalogKindFilter; label: string }[] => [
      { id: "all", label: t("catalog.filters.kind.all") },
      { id: "funding", label: t("catalog.filters.kind.funding") },
      { id: "market", label: t("catalog.filters.kind.market") },
    ],
    [t],
  );
}

export function useCatalogPhaseOptions() {
  const { t } = useI18n();
  return useMemo(
    (): { id: CatalogFundingPhase; label: string }[] => [
      { id: "all", label: t("catalog.filters.phase.all") },
      { id: "open", label: t("catalog.filters.phase.open") },
      { id: "payouts", label: t("catalog.filters.phase.payouts") },
    ],
    [t],
  );
}

export function useCatalogSortOptions() {
  const { t } = useI18n();
  return useMemo(
    (): { id: CatalogSortKey; label: string }[] => [
      { id: "catalog_order", label: t("catalog.sort.catalog_order") },
      { id: "newest", label: t("catalog.sort.newest") },
      { id: "title_asc", label: t("catalog.sort.title_asc") },
      { id: "progress_desc", label: t("catalog.sort.progress_desc") },
      { id: "yield_desc", label: t("catalog.sort.yield_desc") },
      { id: "liquidity_desc", label: t("catalog.sort.liquidity_desc") },
      { id: "volume24h_desc", label: t("catalog.sort.volume24h_desc") },
      { id: "price_asc", label: t("catalog.sort.price_asc") },
      { id: "price_desc", label: t("catalog.sort.price_desc") },
    ],
    [t],
  );
}

export function useCatalogPriceLabel(kind: CatalogKindFilter): string {
  const { t } = useI18n();
  if (kind === "market") return t("catalog.filters.priceLabel.market");
  if (kind === "funding") return t("catalog.filters.priceLabel.funding");
  return t("catalog.filters.priceLabel.all");
}
