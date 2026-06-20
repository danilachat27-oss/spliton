"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  SecondaryMarketAuthGate,
  SecondaryMarketErrorState,
  SecondaryMarketLoadingState,
} from "@/components/dashboard/secondary-market/secondary-market-fetch-states";
import { secondaryMarketHref, isSecondaryBookMarketQuery } from "@/constants/dashboard/secondary-market";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  adaptDepthToBookMarket,
  depthQueryFromMarketKey,
} from "@/lib/secondary-market/secondary-market-book-adapter";
import type { BookMarket } from "@/lib/secondary-market/secondary-market-book.types";
import { getWalletDataSource } from "@/services/wallet.service";
import { fetchMarketDepth, marketErrorMessage } from "@/services/secondary-market.service";

import { SecondaryMarketOrderBookTab } from "./secondary-market-order-book-tab";

export function SecondaryMarketBookPage({ marketId }: { marketId: string }) {
  const { t } = useI18n();
  const isLive = getWalletDataSource() === "live";
  const { isAuthenticated, authorizedFetch } = useAuth();
  const [liveMarket, setLiveMarket] = useState<BookMarket | null>(null);
  const [loading, setLoading] = useState(isLive);
  const [error, setError] = useState<string | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  const load = useCallback(async () => {
    if (!isLive || !isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const depth = await fetchMarketDepth(authorizedFetch, depthQueryFromMarketKey(marketId));
      setLiveMarket(adaptDepthToBookMarket(depth, marketId));
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
  }, [authorizedFetch, isAuthenticated, isLive, marketId]);

  useEffect(() => {
    if (!isLive) {
      if (!isSecondaryBookMarketQuery(marketId)) {
        setNotFoundState(true);
      }
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void load();
  }, [isLive, isAuthenticated, marketId, load]);

  if (notFoundState) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-black px-4 py-16 text-center text-white">
        <h1 className="text-xl font-semibold">{t("secondaryMarket.orderBook.notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("secondaryMarket.orderBook.notFoundDesc")}</p>
        <Link href={secondaryMarketHref("market")} className="mt-6 text-sm text-[#B7F500] hover:underline">
          {t("secondaryMarket.orderBook.backToMarket")}
        </Link>
      </div>
    );
  }

  if (isLive && !isAuthenticated) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col bg-black text-white">
        <header className="shrink-0 border-b border-white/6 px-4 py-3 md:px-5">
          <Link href={secondaryMarketHref("market")} className="text-[13px] font-medium text-zinc-500">
            {t("secondaryMarket.orderBook.backToMarket")}
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <SecondaryMarketAuthGate />
        </div>
      </div>
    );
  }

  if (isLive && loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-black text-white">
        <SecondaryMarketLoadingState label={t("secondaryMarket.orderBook.loading")} />
      </div>
    );
  }

  if (isLive && error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-black p-6 text-white">
        <div className="w-full max-w-lg">
          <SecondaryMarketErrorState message={error} onRetry={() => void load()} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-black text-white">
      <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-3 pt-0 md:pb-4" data-mobile-scroll-root>
        <SecondaryMarketOrderBookTab
          layout="workspace"
          initialMarketId={marketId}
          liveBookMarket={isLive ? liveMarket : null}
          onLiveRefresh={isLive ? () => void load() : undefined}
        />
      </div>
    </div>
  );
}
