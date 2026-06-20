"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReleaseDetailScreen } from "@/features/analytics/releases/detail/release-detail-screen";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import {
  adaptMyHistoryLedgerEvents,
  buildReleaseDetailPageDataFromFullApi,
} from "@/lib/analytics/release-analytics-adapter";
import { getReleaseDetailPageData } from "@/lib/analytics/release-detail";
import { getWalletDataSource } from "@/services/wallet.service";
import {
  fetchMarketLiquidityChart,
  fetchMarketVolumeChart,
  chartPointsToValues,
} from "@/services/market-charts.service";
import {
  fetchReleaseFullDetail,
  fetchReleaseMyHistory,
  fetchReleasePriceChart,
} from "@/services/release-analytics.service";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";
import type { ReleaseLedgerEventUi } from "@/lib/analytics/release-analytics-adapter";

type Props = {
  releaseId: string;
  source?: string;
  showPersonalLedger?: boolean;
};

export function ReleaseDetailLivePage({
  releaseId,
  source,
  showPersonalLedger,
}: Props) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { locale, t } = useI18n();
  const { messageFor } = useApiErrorMessage();
  const live = getWalletDataSource() === "live";
  const [data, setData] = useState<ReleaseDetailPageData | null>(null);
  const [ledgerEvents, setLedgerEvents] = useState<ReleaseLedgerEventUi[] | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!live) {
      setData(getReleaseDetailPageData(releaseId) ?? null);
      setLedgerEvents(undefined);
      return;
    }

    setLoading(true);
    setError(null);
    const fetcher = isAuthenticated ? authorizedFetch : undefined;

    const detailPromise = fetchReleaseFullDetail(releaseId, fetcher);
    const chartPromise = fetchReleasePriceChart(releaseId, "30d", fetcher);
    const volumePromise = fetchMarketVolumeChart(releaseId, "30d", fetcher);
    const liquidityPromise = fetchMarketLiquidityChart(releaseId, "30d", fetcher);
    const historyPromise =
      showPersonalLedger && isAuthenticated
        ? fetchReleaseMyHistory(releaseId, authorizedFetch)
        : Promise.resolve(null);

    void Promise.all([detailPromise, chartPromise, volumePromise, liquidityPromise, historyPromise])
      .then(([detail, chart, volume, liquidity, history]) => {
        const pageData = buildReleaseDetailPageDataFromFullApi(detail, chart, {
          volumeUsdt: chartPointsToValues(volume),
          volumeUnits: volume.points.map((p) => p.values?.volumeUnits ?? 0),
          liquidityVolume24h: liquidity.points.map((p) => p.values?.volume24h ?? p.value),
          liquidityScore: liquidity.points.map((p) => p.value),
        }, locale);
        if (history) {
          pageData.myHistory = history;
          setLedgerEvents(adaptMyHistoryLedgerEvents(history));
        } else {
          setLedgerEvents(undefined);
        }
        setData(pageData);
      })
      .catch((e) => {
        setError(messageFor(e));
        setData(null);
        setLedgerEvents(undefined);
      })
      .finally(() => setLoading(false));
  }, [authorizedFetch, isAuthenticated, live, locale, messageFor, releaseId, showPersonalLedger]);

  if (!live && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-black px-6 text-center text-white">
        <p>{t("analytics.detail.notFound")}</p>
      </div>
    );
  }

  if (live && loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-black px-6 text-white">
        <p className="text-sm text-zinc-400">{t("analytics.detail.loading")}</p>
      </div>
    );
  }

  if (live && error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-black px-6">
        <p className="rounded-xl bg-red-950/80 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-black px-6 text-center text-white">
        <p>{t("analytics.detail.notFound")}</p>
      </div>
    );
  }

  return (
    <ReleaseDetailScreen
      data={data}
      source={source}
      showPersonalLedger={showPersonalLedger}
      ledgerEvents={ledgerEvents}
      isLive={live}
      chartLoading={loading}
    />
  );
}
