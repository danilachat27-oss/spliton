"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { SecondaryMarketDetailShell } from "@/components/dashboard/secondary-market/secondary-market-detail-shell";
import { SecondaryMarketListingInfoScreen } from "@/components/dashboard/secondary-market/secondary-market-listing-info-screen";
import {
  SecondaryMarketAuthGate,
  SecondaryMarketErrorState,
  SecondaryMarketLoadingState,
} from "@/components/dashboard/secondary-market/secondary-market-fetch-states";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  adaptListingDetailToMock,
  adaptRecentTrades,
  buildReleaseDetailStub,
} from "@/lib/secondary-market/secondary-market-listing-detail-adapter";
import {
  getSecondaryMarketListingById,
  getSecondaryMarketListingTradesMock,
} from "@/mocks/dashboard/secondary-market-listings.mock";
import { getReleaseDetailPageData } from "@/lib/analytics/release-detail";
import { fetchListingDetail, marketErrorMessage } from "@/services/secondary-market.service";
import { getWalletDataSource } from "@/services/wallet.service";
import type { SecondaryMarketListingMock, SecondaryMarketListingTradeMock } from "@/mocks/dashboard/secondary-market-listings.mock";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function SecondaryMarketListingDetailPage({ listingId }: { listingId: string }) {
  const { t, locale } = useI18n();
  const isLive = getWalletDataSource() === "live";
  const { isAuthenticated, authorizedFetch } = useAuth();
  const [listing, setListing] = useState<SecondaryMarketListingMock | null>(null);
  const [trades, setTrades] = useState<SecondaryMarketListingTradeMock[] | null>(null);
  const [releaseDetail, setReleaseDetail] = useState<ReturnType<typeof buildReleaseDetailStub> | null>(null);
  const [loading, setLoading] = useState(isLive);
  const [error, setError] = useState<string | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  const loadLive = useCallback(async () => {
    if (!isLive || !isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchListingDetail(authorizedFetch, listingId);
      setListing(adaptListingDetailToMock(detail));
      setTrades(adaptRecentTrades(detail));
      setReleaseDetail(buildReleaseDetailStub(detail, t, locale));
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 404) {
        setNotFoundState(true);
        return;
      }
      setError(marketErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, isAuthenticated, isLive, listingId]);

  useEffect(() => {
    if (!isLive) {
      const mock = getSecondaryMarketListingById(listingId);
      if (!mock) {
        setNotFoundState(true);
        return;
      }
      const rd = getReleaseDetailPageData(mock.analyticsCatalogId);
      if (!rd) {
        setNotFoundState(true);
        return;
      }
      setListing(mock);
      setTrades(getSecondaryMarketListingTradesMock(mock));
      setReleaseDetail(rd);
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (!UUID_RE.test(listingId)) {
      setNotFoundState(true);
      setLoading(false);
      return;
    }
    void loadLive();
  }, [isLive, isAuthenticated, listingId, loadLive]);

  if (notFoundState) {
    return (
      <SecondaryMarketDetailShell center>
        <h1 className="text-xl font-semibold">{t("secondaryMarket.listingDetail.notFoundTitle")}</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">{t("secondaryMarket.listingDetail.notFoundDesc")}</p>
        <Link
          href={secondaryMarketHref("market")}
          className="mt-6 text-sm text-[#B7F500] hover:underline"
        >
          {t("secondaryMarket.listingDetail.backToMarket")}
        </Link>
      </SecondaryMarketDetailShell>
    );
  }

  if (isLive && !isAuthenticated) {
    return (
      <SecondaryMarketDetailShell center>
        <div className="w-full max-w-lg text-left">
          <SecondaryMarketAuthGate />
        </div>
      </SecondaryMarketDetailShell>
    );
  }

  if (loading) {
    return (
      <SecondaryMarketDetailShell center>
        <SecondaryMarketLoadingState label={t("secondaryMarket.listingDetail.loading")} />
      </SecondaryMarketDetailShell>
    );
  }

  if (error) {
    return (
      <SecondaryMarketDetailShell center>
        <div className="w-full max-w-lg text-left">
          <SecondaryMarketErrorState message={error} onRetry={() => void loadLive()} />
        </div>
      </SecondaryMarketDetailShell>
    );
  }

  if (!listing || !releaseDetail) return null;

  return (
    <SecondaryMarketDetailShell className="antialiased">
      <SecondaryMarketListingInfoScreen
        listing={listing}
        releaseDetail={releaseDetail}
        tradesOverride={isLive ? trades ?? undefined : undefined}
      />
    </SecondaryMarketDetailShell>
  );
}
