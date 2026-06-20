"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { ReleaseMarketAnalyticsScreen } from "@/features/catalog/market-overview/release-analytics/release-market-analytics-screen";
import { buildReleaseMarketAnalyticsFromOverviewDetail } from "@/lib/market-overview/market-overview-adapter";
import { getCatalogReleaseMarketAnalyticsPageData } from "@/lib/catalog/release-market-analytics";
import { getWalletDataSource } from "@/services/wallet.service";
import { fetchMarketOverviewDetail } from "@/services/market-overview.service";
import type { ReleaseMarketAnalyticsPageData } from "@/types/catalog/release-market-analytics";

export function ReleaseMarketAnalyticsLivePage({ releaseId }: { releaseId: string }) {
  const { t } = useI18n();
  const live = getWalletDataSource() === "live";
  const [data, setData] = useState<ReleaseMarketAnalyticsPageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!live) {
      setData(getCatalogReleaseMarketAnalyticsPageData(releaseId) ?? null);
      return;
    }
    void fetchMarketOverviewDetail(releaseId, { period: "30d" })
      .then((detail) => {
        setData(buildReleaseMarketAnalyticsFromOverviewDetail(detail));
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Не удалось загрузить аналитику");
        setData(null);
      });
  }, [live, releaseId]);

  if (!live && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white">
        <p>{t("catalog.releaseAnalytics.notFound")}</p>
      </div>
    );
  }

  if (live && error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white">
        <p>{t("catalog.releaseAnalytics.loading")}</p>
      </div>
    );
  }

  return <ReleaseMarketAnalyticsScreen data={data} />;
}
