"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { catalogMarketOverviewReleaseAnalyticsPath } from "@/constants/routes";
import type { MarketOverviewTradeApi } from "@/services/market-overview.service";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MarketOverviewTradesBlock({
  live,
  items,
  loading,
  error,
  onRetry,
}: {
  live?: boolean;
  items: MarketOverviewTradeApi[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const { t } = useI18n();

  if (!live) return null;

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
      <header className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-white">{t("marketOverview.trades.title")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("marketOverview.trades.subtitle")}</p>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {t("marketOverview.trades.error")}
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
          {t("marketOverview.trades.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[#111111]">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.trades.table.release")}</th>
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.trades.table.units")}</th>
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.trades.table.price")}</th>
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.trades.table.total")}</th>
                <th className="px-3 py-2.5 font-normal">{t("marketOverview.trades.table.time")}</th>
                <th className="px-3 py-2.5 text-right font-normal">{t("marketOverview.trades.table.details")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((trade) => (
                <tr key={trade.id} className="text-zinc-300">
                  <td className="px-3 py-2 align-middle">
                    <div className="font-semibold text-white">{trade.releaseSymbol}</div>
                    <div className="text-[12px] text-zinc-500">{trade.releaseTitle}</div>
                  </td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums">{trade.units}</td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums">{trade.pricePerUnitUsdt} USDT</td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums">{trade.totalUsdt} USDT</td>
                  <td className="px-3 py-2 align-middle font-mono text-[12px] tabular-nums text-zinc-400">
                    {formatWhen(trade.executedAt)}
                  </td>
                  <td className="px-3 py-2 align-middle text-right">
                    <Link
                      href={catalogMarketOverviewReleaseAnalyticsPath(trade.releaseId)}
                      className="text-[12px] font-medium text-zinc-400 hover:text-white hover:underline"
                    >
                      {t("marketOverview.trades.details")}
                    </Link>
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
