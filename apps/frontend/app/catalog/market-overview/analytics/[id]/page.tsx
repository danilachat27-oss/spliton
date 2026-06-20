import type { Metadata } from "next";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { catalogMarketOverviewReleaseAnalyticsPath } from "@/constants/routes";
import { ReleaseMarketAnalyticsLivePage } from "@/features/catalog/market-overview/release-market-analytics-live-page";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Аналитика релиза",
    description: "Внутренняя аналитика релиза: метрики, графики, ликвидность и выплаты.",
    alternates: {
      canonical: catalogMarketOverviewReleaseAnalyticsPath(id),
    },
  };
}

export default async function CatalogMarketOverviewReleaseAnalyticsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-mobile-scroll-root>
        <DashboardHeader sticky={false} />
        <ReleaseMarketAnalyticsLivePage releaseId={id} />
      </div>
    </div>
  );
}
