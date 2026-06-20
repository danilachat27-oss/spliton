import type { Metadata } from "next";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReleaseDetailLivePage } from "@/features/analytics/releases/detail/release-detail-live-page";
import { getReleaseDetailPageData } from "@/lib/analytics/release-detail";
import {
  analyticsReleasePageMetaAsync,
  analyticsReleasePageMetaTfAsync,
} from "@/lib/i18n/page-metadata";
import { fetchReleaseFullDetail } from "@/services/release-analytics.service";
import { getWalletDataSource } from "@/services/wallet.service";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = { params: Promise<{ id: string }> };
type PageSearchParams = Promise<{ from?: string | string[]; view?: string | string[] }>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const mock = getReleaseDetailPageData(id);
  if (mock) {
    return analyticsReleasePageMetaTfAsync(
      "meta.analyticsRelease.titleWithSymbol",
      "meta.analyticsRelease.descriptionWithRelease",
      { symbol: mock.row.symbol, title: mock.row.release },
    );
  }

  if (getWalletDataSource() === "live" && UUID_RE.test(id)) {
    try {
      const detail = await fetchReleaseFullDetail(id, undefined, "ru");
      return analyticsReleasePageMetaTfAsync(
        "meta.analyticsRelease.titleWithSymbol",
        "meta.analyticsRelease.descriptionWithRelease",
        { symbol: detail.identity.symbol, title: detail.identity.title },
      );
    } catch {
      // fallback to generic meta below
    }
  }

  return analyticsReleasePageMetaAsync("meta.analyticsRelease.title", "meta.analyticsRelease.description");
}

export default async function AnalyticsReleaseDetailPage({
  params,
  searchParams,
}: PageProps & { searchParams: PageSearchParams }) {
  const { id } = await params;
  const { from, view } = await searchParams;
  const source = Array.isArray(from) ? from[0] : from;
  const viewParam = Array.isArray(view) ? view[0] : view;
  const showPersonalLedger = viewParam === "ledger";
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-120 shrink-0 bg-black">
        <DashboardHeader />
      </div>
      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-auto" data-mobile-scroll-root>
        <ReleaseDetailLivePage
          releaseId={id}
          source={source}
          showPersonalLedger={showPersonalLedger}
        />
      </div>
    </div>
  );
}
