import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { catalogBuyUnitsPath } from "@/constants/routes";
import { CatalogBuyUnitsPageContent } from "@/features/catalog/buy-units/catalog-buy-units-page-content";
import { CatalogBuyUnitsSkeleton } from "@/features/catalog/buy-units/catalog-buy-units-skeleton";
import { resolveCatalogBuyPageData } from "@/lib/catalog/release-buy";
import { criticalPageMetaAsync, criticalPageMetaTfAsync } from "@/lib/i18n/page-metadata";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const buy = await resolveCatalogBuyPageData(id);
  const row = buy?.row;
  if (!row) {
    return criticalPageMetaAsync("meta.catalog.buy.title", "meta.catalog.description");
  }
  const meta = await criticalPageMetaTfAsync(
    "meta.catalog.buy.titleWithSymbol",
    "meta.catalog.buy.descriptionWithRelease",
    { symbol: row.symbol, title: row.title },
  );
  return { ...meta, alternates: { canonical: catalogBuyUnitsPath(id) } };
}

export default async function CatalogBuyUnitsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-120 shrink-0 bg-black">
        <DashboardHeader sticky={false} />
      </div>
      <div
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
        data-mobile-scroll-root
      >
        <Suspense fallback={<CatalogBuyUnitsSkeleton />}>
          <CatalogBuyUnitsPageContent id={id} />
        </Suspense>
      </div>
    </div>
  );
}
