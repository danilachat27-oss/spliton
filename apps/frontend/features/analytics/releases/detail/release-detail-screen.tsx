import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { analyticsReleasePersonalLedgerPath } from "@/constants/routes";
import type { ReleaseLedgerEventUi } from "@/lib/analytics/release-analytics-adapter";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";

import { ReleaseDetailAbout } from "./release-detail-about";
import { ReleaseDetailDataRoom } from "./release-detail-data-room";
import { ReleaseDetailFaq } from "./release-detail-faq";
import { ReleaseDetailHero } from "./release-detail-hero";
import { ReleaseDetailHow } from "./release-detail-how";
import { ReleaseDetailPayoutHistory } from "./release-detail-payout-history";
import { ReleaseDetailPerformanceChart } from "./release-detail-performance-chart";
import { ReleaseDetailSecondaryOrderPage } from "./release-detail-secondary-order-page";
import { ReleaseDetailSecondary } from "./release-detail-secondary";
import { ReleaseDetailSidebar } from "./release-detail-sidebar";
import { ReleaseDetailStatsRow } from "./release-detail-stats-row";
import { ReleaseDetailTerms } from "./release-detail-terms";

export function ReleaseDetailScreen({
  data,
  source,
  showPersonalLedger = false,
  ledgerEvents,
  isLive = false,
  chartLoading = false,
}: {
  data: ReleaseDetailPageData;
  source?: string;
  /** `?view=ledger` — заявки, позиция и персональная история; не карточка актива. */
  showPersonalLedger?: boolean;
  ledgerEvents?: ReleaseLedgerEventUi[];
  isLive?: boolean;
  chartLoading?: boolean;
}) {
  if (showPersonalLedger) {
    return (
      <ReleaseDetailSecondaryOrderPage
        data={data}
        contextFrom={source}
        ledgerEvents={ledgerEvents}
        isLive={isLive}
      />
    );
  }

  const secondaryStackHref = source === "secondary" ? data.secondary.marketHref : undefined;
  const secondaryBuyHref =
    source === "secondary" ? (secondaryStackHref ?? secondaryMarketHref("market")) : undefined;
  const secondaryBuyLabel =
    source === "secondary" ? (secondaryStackHref ? "К стакану" : "На рынок") : undefined;

  const personalLedgerHref = analyticsReleasePersonalLedgerPath(data.row.id, source ? { from: source } : undefined);

  return (
    <div className="bg-black text-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-4 max-sm:pb-28 sm:pt-6 md:px-6 lg:px-8 lg:pb-24 lg:pt-8">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(360px,100%)] lg:items-start">
          <div className="min-w-0">
            <ReleaseDetailHero data={data} source={source} />
          </div>
          <div>
            <ReleaseDetailSidebar data={data} personalLedgerHref={personalLedgerHref} isLive={isLive} />
          </div>
        </div>

        <div className="mt-10">
          <ReleaseDetailPerformanceChart
            title={data.performance.title}
            subtitle={data.performance.subtitle}
            seriesByPeriod={data.performance.seriesByPeriod}
            miniStats={data.performance.miniStats}
            releaseId={data.row.id}
            releaseSlug={data.slug}
            buyHref={secondaryBuyHref}
            buyLabel={secondaryBuyLabel}
            pageState={data.pageState}
            chartLoading={chartLoading}
          />
        </div>

        <div className="mt-6">
          <ReleaseDetailStatsRow data={data} />
        </div>

        <ReleaseDetailAbout data={data} />
        <ReleaseDetailHow data={data} />
        <ReleaseDetailTerms data={data} />
        <ReleaseDetailPayoutHistory data={data} />
        <ReleaseDetailSecondary data={data} />
        <ReleaseDetailDataRoom releaseId={data.row.id} />
        <ReleaseDetailFaq data={data} />
      </div>
    </div>
  );
}
