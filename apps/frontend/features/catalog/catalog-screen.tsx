"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/providers/i18n-provider";
import { catalogBuyUnitsPath } from "@/constants/routes";
import { isCatalogPrimaryPurchasable } from "@/lib/catalog/catalog-purchase.util";
import { catalogReleaseDetailHref } from "@/lib/catalog/catalog-release-nav";
import { catalogItems } from "@/lib/catalog-mock";
import { isLiveCatalogEnabled } from "@/services/catalog.service";
import type { CatalogSearchSuggestionItem } from "@/types/catalog/page";

import { useCatalogActiveFilters } from "./hooks/use-catalog-active-filters";
import { useCatalogScreenState } from "./hooks/use-catalog-screen-state";
import { CatalogFiltersAside } from "./sections/catalog-filters-aside";
import { CatalogMainArea } from "./sections/catalog-main-area";
import { CatalogSearchModal } from "./ui/catalog-search-modal";

export function CatalogScreen() {
  const router = useRouter();
  const state = useCatalogScreenState();
  const { t, locale } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);

  const activeFilters = useCatalogActiveFilters({
    query: state.query,
    kind: state.kind,
    phase: state.phase,
    genre: state.genre,
    sort: state.sort,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    minProgress: state.minProgress,
    minYield: state.minYield,
    minLiquidity: state.minLiquidity,
    onQuery: state.setQuery,
    onKind: state.setKind,
    onPhase: state.setPhase,
    onGenre: state.setGenre,
    onSort: state.setSort,
    onMinPrice: state.setMinPrice,
    onMaxPrice: state.setMaxPrice,
    onMinProgress: state.setMinProgress,
    onMinYield: state.setMinYield,
    onMinLiquidity: state.setMinLiquidity,
    locale,
    t,
  });

  const handleSuggestion = (item: CatalogSearchSuggestionItem) => {
    if (item.type === "release" && item.releaseId) {
      const notPurchasable =
        item.canPurchase === false ||
        (item.purchaseState != null && !isCatalogPrimaryPurchasable(item.purchaseState));

      if (!isLiveCatalogEnabled()) {
        const mockItem = catalogItems.find(
          (entry) => entry.id === item.releaseId || entry.slug === item.slug,
        );
        if (
          mockItem?.kind === "funding" &&
          !isCatalogPrimaryPurchasable(mockItem.purchaseState)
        ) {
          router.push(catalogReleaseDetailHref({ id: item.releaseId, slug: item.slug }));
          return;
        }
      } else if (notPurchasable) {
        router.push(catalogReleaseDetailHref({ id: item.releaseId, slug: item.slug }));
        return;
      }

      router.push(catalogBuyUnitsPath(item.slug ?? item.releaseId));
      return;
    }
    if (item.type === "genre") {
      state.setGenre(item.value);
      return;
    }
    state.setQuery(item.value);
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-black lg:flex-row lg:items-stretch">
      <CatalogSearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        query={state.query}
        onQuery={state.setQuery}
        onSelectSuggestion={handleSuggestion}
        liveMode={state.liveMode}
      />
      <CatalogFiltersAside
        query={state.query}
        onQuery={state.setQuery}
        onSelectSuggestion={handleSuggestion}
        kind={state.kind}
        onKind={state.setKind}
        phase={state.phase}
        onPhase={state.setPhase}
        genre={state.genre}
        onGenre={state.setGenre}
        genres={state.genres}
        genreCounts={state.genreCounts}
        sort={state.sort}
        onSort={state.setSort}
        minPrice={state.minPrice}
        onMinPrice={state.setMinPrice}
        maxPrice={state.maxPrice}
        onMaxPrice={state.setMaxPrice}
        minProgress={state.minProgress}
        onMinProgress={state.setMinProgress}
        minYield={state.minYield}
        onMinYield={state.setMinYield}
        minLiquidity={state.minLiquidity}
        onMinLiquidity={state.setMinLiquidity}
        priceLabel={state.priceLabel}
        filteredCount={state.matchingCount}
        totalCount={state.catalogTotal}
        onReset={state.resetFilters}
        liveMode={state.liveMode}
        mobileOpen={state.mobileFiltersOpen}
        onMobileOpenChange={state.setMobileFiltersOpen}
        activeFilters={activeFilters}
      />
      <CatalogMainArea
        catalogView={state.catalogView}
        onCatalogView={state.setCatalogView}
        filtered={state.filtered}
        resultCount={state.resultCount}
        totalCount={state.matchingCount}
        pagination={state.pagination}
        page={state.page}
        onPageChange={state.setPage}
        catalogLoading={state.catalogLoading}
        catalogError={state.catalogError}
        liveMode={state.liveMode}
        stats={state.stats}
        statsUnavailable={state.statsUnavailable}
        onReloadCatalog={state.reloadCatalog}
        hasActiveFilters={activeFilters.length > 0}
        onResetFilters={state.resetFilters}
        onOpenFilters={() => state.setMobileFiltersOpen(true)}
        activeFiltersCount={activeFilters.length}
        activeFilters={activeFilters}
        kind={state.kind}
        onKind={state.setKind}
        genre={state.genre}
        onGenre={state.setGenre}
        onFocusSearch={() => setSearchOpen(true)}
      />
    </div>
  );
}
