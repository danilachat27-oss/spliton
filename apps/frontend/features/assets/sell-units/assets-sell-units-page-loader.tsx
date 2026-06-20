import { notFound } from "next/navigation";

import { PortfolioOverviewSkeleton } from "@/components/dashboard/assets/portfolio-overview-skeleton";
import { AssetsSellUnitsPageContent } from "@/features/assets/sell-units/assets-sell-units-page-content";
import { resolveSellPageCatalogRow } from "@/lib/assets/resolve-sell-page-data";

export async function AssetsSellUnitsPageContentLoader({ id }: { id: string }) {
  const row = await resolveSellPageCatalogRow(id);
  if (!row) notFound();
  return <AssetsSellUnitsPageContent catalogId={id} row={row} />;
}

export function AssetsSellUnitsPageSkeleton() {
  return (
    <div className="space-y-10 pb-8 sm:space-y-12">
      <PortfolioOverviewSkeleton />
    </div>
  );
}
