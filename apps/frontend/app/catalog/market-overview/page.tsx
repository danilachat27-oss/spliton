import { Suspense } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MarketOverviewScreen } from "@/components/market-overview/market-overview-screen";
import { marketOverviewPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return marketOverviewPageMetaAsync(
    "meta.marketOverview.title",
    "meta.marketOverview.description",
  );
}

export default function CatalogMarketOverviewPage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-120 shrink-0 bg-black">
        <DashboardHeader />
      </div>
      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<div className="h-full min-h-[320px] bg-black" aria-hidden />}>
          <MarketOverviewScreen />
        </Suspense>
      </div>
    </div>
  );
}
