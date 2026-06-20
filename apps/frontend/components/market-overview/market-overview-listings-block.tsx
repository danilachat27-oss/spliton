"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { secondaryMarketListingInfoPath } from "@/constants/routes";
import type { MarketOverviewListingApi } from "@/services/market-overview.service";

export function MarketOverviewListingsBlock({
  live,
  items,
  loading,
  error,
  onRetry,
}: {
  live?: boolean;
  items: MarketOverviewListingApi[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const { t } = useI18n();

  if (!live) return null;

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
      <header className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-white">{t("marketOverview.listings.title")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("marketOverview.listings.subtitle")}</p>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {t("marketOverview.listings.error")}
          {onRetry ? (
            <button type="button" className="ml-2 underline" onClick={onRetry}>
              {t("marketOverview.retry")}
            </button>
          ) : null}
        </div>
      ) : loading && items.length === 0 ? (
        <div className="space-y-2" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-[#111111] px-4 py-8 text-center text-sm text-zinc-400">
          {t("marketOverview.listings.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[#111111]">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.listings.table.release")}</th>
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.listings.table.units")}</th>
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.listings.table.price")}</th>
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.listings.table.total")}</th>
                <th className="px-3 py-2.5 text-right font-normal">{t("marketOverview.listings.table.action")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="text-zinc-300">
                  <td className="px-3 py-2 align-middle">
                    <div className="font-semibold text-white">{l.releaseSymbol}</div>
                    <div className="text-[12px] text-zinc-500">{l.releaseTitle}</div>
                  </td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums">{l.units}</td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums">{l.pricePerUnitUsdt} USDT</td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums">{l.totalUsdt} USDT</td>
                  <td className="px-3 py-2 align-middle text-right">
                    {l.buyable ? (
                      <Link
                        href={secondaryMarketListingInfoPath(l.id)}
                        className="text-[12px] font-medium text-[#B7F500] hover:underline"
                      >
                        {t("marketOverview.listings.buy")}
                      </Link>
                    ) : (
                      <span className="text-[12px] text-zinc-600">{t("marketOverview.listings.unavailable")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
