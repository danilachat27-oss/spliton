"use client";

import Link from "next/link";
import { ExternalLink, Star, Trash2 } from "@/lib/lucide";

import { SecondaryMarketResponsiveSheet } from "@/components/dashboard/secondary-market/secondary-market-responsive-sheet";
import { smExchange } from "@/components/dashboard/secondary-market/secondary-market-exchange-styles";
import type { WatchlistItem } from "@/components/dashboard/secondary-market/secondary-market-watchlist.types";
import { ExchangeNeonSparkline } from "@/components/shared/charts/exchange-neon-sparkline";
import { useI18n } from "@/components/providers/i18n-provider";
import { secondaryMarketBookHref, secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { analyticsReleaseDetailPath, secondaryMarketReleaseAnalyticsPath } from "@/constants/routes";
import { getSecondaryMarketAnalyticsCatalogIdForReleaseSlug } from "@/mocks/dashboard/secondary-market-listings.mock";
import { cn } from "@/lib/utils";
import {
  smTableActionReleasePill,
  smTableActionSecondaryPill,
} from "@/components/dashboard/secondary-market/secondary-market-table-action-styles";

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function liquidityLabel(l: WatchlistItem["liquidity"], t: (key: string) => string) {
  if (l === "high") return t("secondaryMarket.kpi.liquidity.high");
  if (l === "med") return t("secondaryMarket.kpi.liquidity.med");
  return t("secondaryMarket.kpi.liquidity.low");
}

function bookHref(bookMarketId: string | null) {
  if (!bookMarketId) return secondaryMarketHref("market");
  return secondaryMarketBookHref(bookMarketId);
}

type Props = {
  item: WatchlistItem | null;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
};

export function SecondaryMarketWatchlistDetailSheet({ item, onOpenChange, onRemove }: Props) {
  const { t } = useI18n();
  const pos = item ? item.change24hPct >= 0 : true;
  const change24hLabel = t("secondaryMarket.watchlist.column24h");

  return (
    <SecondaryMarketResponsiveSheet
      open={item != null}
      onOpenChange={onOpenChange}
      title={item?.track ?? t("secondaryMarket.listingDetail.releaseFallback")}
      description={item ? `${item.artist} · ${item.symbol}` : undefined}
      widthClassName="md:w-[min(100vw-1rem,480px)]"
      footer={
        item ? (
          <div className="space-y-2">
            <Link
              href={bookHref(item.bookMarketId)}
              className={cn(smExchange.submitBuy, "inline-flex h-11 items-center justify-center")}
              onClick={() => onOpenChange(false)}
            >
              {item.bookMarketId ? t("secondaryMarket.watchlist.openBook") : t("secondaryMarket.actions.goToMarket")}
            </Link>
            <div className="flex gap-2">
              <Link
                href={secondaryMarketReleaseAnalyticsPath(item.releaseId)}
                scroll={false}
                className={cn(smTableActionSecondaryPill, "h-10 flex-1 justify-center")}
                onClick={() => onOpenChange(false)}
              >
                {t("secondaryMarket.watchlist.analytics")}
              </Link>
              <Link
                href={`${analyticsReleaseDetailPath(getSecondaryMarketAnalyticsCatalogIdForReleaseSlug(item.releaseId))}?from=catalog`}
                className={cn(smTableActionReleasePill, "h-10 flex-1 justify-center")}
                onClick={() => onOpenChange(false)}
              >
                {t("secondaryMarket.actions.release")}
                <ExternalLink className="size-3.5 opacity-55" aria-hidden />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                onRemove(item.id);
                onOpenChange(false);
              }}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-fuchsia-500/15 font-mono text-[12px] font-semibold text-fuchsia-200 transition hover:bg-fuchsia-500/22"
            >
              <Trash2 className="size-4" aria-hidden />
              {t("secondaryMarket.watchlist.removeFromList")}
            </button>
          </div>
        ) : undefined
      }
    >
      {item ? (
        <div className="space-y-4 pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star className="size-4 fill-[#B7F500]/25 text-[#B7F500]" aria-hidden />
              <span className="font-mono text-[11px] text-zinc-500">{t("secondaryMarket.watchlist.inWatchlist")}</span>
            </div>
            {item.spark.length >= 2 ? (
              <ExchangeNeonSparkline
                values={item.spark}
                trend={pos ? "up" : "down"}
                width={88}
                height={26}
                detailSegments={4}
              />
            ) : null}
          </div>

          <dl className="space-y-0 font-mono text-[12px]">
            {[
              [t("secondaryMarket.trade.pricePerUnitUnt"), `${formatUsdt(item.pricePerUnit)} USDT`],
              [
                change24hLabel,
                `${pos ? "+" : ""}${item.change24hPct.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`,
              ],
              [t("secondaryMarket.watchlist.listingsCount"), String(item.listingsCount)],
              [t("secondaryMarket.watchlist.unitsInBook"), String(item.unitsInBook)],
              [t("secondaryMarket.watchlist.deals24h"), String(item.deals24h)],
              [t("secondaryMarket.analytics.liquidity"), liquidityLabel(item.liquidity, t)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-white/5 py-2.5">
                <dt className="text-zinc-600">{label}</dt>
                <dd
                  className={cn(
                    "text-right tabular-nums text-zinc-200",
                    label === change24hLabel && (pos ? "text-[#B7F500]" : "text-fuchsia-300"),
                  )}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="rounded-xl bg-white/3 p-3.5 text-[12px] leading-relaxed text-zinc-500">
            {t("secondaryMarket.watchlist.detailHint")}
          </p>
        </div>
      ) : null}
    </SecondaryMarketResponsiveSheet>
  );
}
