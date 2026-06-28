"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SortHeader } from "@/components/shared/exchange/sort-header";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  catalogBuyUnitsPath,
  catalogMarketOverviewReleaseAnalyticsPath,
  ROUTES,
} from "@/constants/routes";
import { formatUsdtCompact, formatUnitsCompact } from "@/lib/market-overview/format";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { AppLocale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import type { MarketOverviewRow, MarketTableSortKey } from "@/types/market-overview";

import { MarketMiniSparkline } from "./ui/market-mini-sparkline";

function formatSecondaryDemandLabel(
  label: MarketOverviewRow["secondaryLabel"],
  locale: AppLocale,
): string {
  if (label === "—") return "—";
  const map: Record<string, "high" | "medium" | "low"> = {
    Высокий: "high",
    Средний: "medium",
    Низкий: "low",
    High: "high",
    Medium: "medium",
    Low: "low",
  };
  const code = map[label];
  return code ? statusLabel("liquidity", code, locale) : label;
}

function formatPercentValue(value: number, locale: AppLocale): string {
  return `${new Intl.NumberFormat(locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-PT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function CoverThumb({ symbol }: { symbol: string }) {
  const hue = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-9 shrink-0 rounded-full"
      style={{
        background: `linear-gradient(145deg, hsl(${hue}, 42%, 28%) 0%, hsl(${(hue + 48) % 360}, 28%, 12%) 100%)`,
      }}
      aria-hidden
    />
  );
}

function MarketOverviewMobileRow({ row, live }: { row: MarketOverviewRow; live?: boolean }) {
  const router = useRouter();
  const pos = row.trend === "up";
  const neg = row.trend === "down";
  const price =
    live && row.lastPriceUsdt != null && row.lastPriceUsdt > 0
      ? `$${formatUsdtCompact(row.lastPriceUsdt)}`
      : `${row.yieldPct.toFixed(1).replace(".", ",")}%`;

  return (
    <button
      type="button"
      id={`market-release-${row.id}`}
      className="flex w-full items-center gap-3 border-b border-white/[0.04] py-3.5 text-left transition-colors active:bg-white/[0.03] data-[release-focus=1]:bg-white/[0.06]"
      onClick={() => router.push(catalogMarketOverviewReleaseAnalyticsPath(row.id))}
    >
      <CoverThumb symbol={row.symbol} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-white">{row.symbol}</p>
        <p className="truncate text-[12px] text-zinc-500">
          {row.title} · {row.artist}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-[14px] font-semibold tabular-nums text-white">{price}</p>
        <p
          className={cn(
            "font-mono text-[11px] tabular-nums",
            pos && "text-[#B7F500]",
            neg && "text-fuchsia-300",
            !pos && !neg && "text-zinc-500",
          )}
        >
          {pos ? "▲" : neg ? "▼" : "—"} {row.activityScore}
        </p>
      </div>
    </button>
  );
}

export function MarketOverviewTable({
  rows,
  live,
  sort,
  sortDir,
  onSort,
}: {
  rows: MarketOverviewRow[];
  live?: boolean;
  sort: MarketTableSortKey;
  sortDir: "asc" | "desc";
  onSort: (k: MarketTableSortKey) => void;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between py-2.5 text-[11px] text-zinc-500 md:hidden">
        <span>{t("marketOverview.table.mobile.name")}</span>
        <span>{t("marketOverview.table.mobile.priceChange")}</span>
      </div>

      <div className="md:hidden">
        {rows.map((r) => (
          <MarketOverviewMobileRow key={r.id} row={r} live={live} />
        ))}
        {rows.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-zinc-500">{t("marketOverview.table.empty")}</div>
        ) : null}
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-xl bg-[#111111] md:block">
        <table className="w-full min-w-[1180px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="text-zinc-500">
              <th className="px-3 py-2.5 font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.release")}</span>
              </th>
              <th className="px-3 py-2.5 font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.artistSegment")}</span>
              </th>
              <th className="px-3 py-2.5">
                <SortHeader
                  label={t("marketOverview.table.yield")}
                  active={sort === "yield"}
                  dir={sort === "yield" ? sortDir : "desc"}
                  onClick={() => onSort("yield")}
                />
              </th>
              <th className="px-3 py-2.5">
                <SortHeader
                  label={t("marketOverview.table.payouts")}
                  active={sort === "payouts"}
                  dir={sort === "payouts" ? sortDir : "desc"}
                  onClick={() => onSort("payouts")}
                  align="right"
                />
              </th>
              <th className="px-3 py-2.5">
                <SortHeader
                  label={t("marketOverview.table.activity")}
                  active={sort === "activity"}
                  dir={sort === "activity" ? sortDir : "desc"}
                  onClick={() => onSort("activity")}
                  align="right"
                />
              </th>
              <th className="px-3 py-2.5">
                <SortHeader
                  label={t("marketOverview.table.availUnt")}
                  active={sort === "units"}
                  dir={sort === "units" ? sortDir : "desc"}
                  onClick={() => onSort("units")}
                  align="right"
                />
              </th>
              <th className="px-3 py-2.5 font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.vol24h")}</span>
              </th>
              <th className="px-3 py-2.5 font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.last")}</span>
              </th>
              <th className="px-3 py-2.5 font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.listings")}</span>
              </th>
              <th className="px-3 py-2.5 font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.spread")}</span>
              </th>
              <th className="px-3 py-2.5 font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.liquidity")}</span>
              </th>
              <th className="px-3 py-2.5 font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.trend")}</span>
              </th>
              <th className="px-3 py-2.5 text-right font-normal">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.table.action")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const deltaClass =
                r.trend === "up" ? "text-[#B7F500]" : r.trend === "down" ? "text-fuchsia-400" : "text-zinc-500";
              return (
                <tr
                  key={r.id}
                  id={`market-release-${r.id}-desktop`}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer text-zinc-300 transition-colors hover:bg-white/[0.04] data-[release-focus=1]:bg-white/[0.07] data-[release-focus=1]:ring-2 data-[release-focus=1]:ring-inset data-[release-focus=1]:ring-[#B7F500]/35"
                  onClick={() => router.push(catalogMarketOverviewReleaseAnalyticsPath(r.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(catalogMarketOverviewReleaseAnalyticsPath(r.id));
                    }
                  }}
                >
                  <td className="px-3 py-2 align-middle">
                    <div className="flex items-center gap-2">
                      <CoverThumb symbol={r.symbol} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-1.5">
                          <span className="font-mono text-[12px] font-semibold tabular-nums text-white">{r.symbol}</span>
                          <span className="truncate text-[12px] text-zinc-500">{r.title}</span>
                        </div>
                        <div className="mt-1">
                          <span className="rounded-md bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                            {statusLabel("release", r.status, locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="text-white">{r.artist}</div>
                    <div className="text-[11px] text-zinc-600">{r.segment}</div>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="font-mono font-semibold tabular-nums text-[#B7F500]">
                      {r.yieldPct.toFixed(1).replace(".", ",")}%
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle text-right font-mono tabular-nums text-white">
                    {formatUsdtCompact(r.payoutsUsdt)} USDT
                  </td>
                  <td className="px-3 py-2 align-middle text-right font-mono tabular-nums text-zinc-200">
                    {r.activityScore}
                  </td>
                  <td className="px-3 py-2 align-middle text-right font-mono tabular-nums text-zinc-300">
                    {formatUnitsCompact(r.availableUnits)}
                  </td>
                  <td className="px-3 py-2 align-middle text-right font-mono tabular-nums text-zinc-300">
                    {live
                      ? r.volume24hUsdt != null && r.volume24hUsdt > 0
                        ? `${formatUsdtCompact(r.volume24hUsdt)} USDT`
                        : "—"
                      : "—"}
                  </td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums text-zinc-300">
                    {live && r.lastPriceUsdt != null && r.lastPriceUsdt > 0
                      ? `${formatUsdtCompact(r.lastPriceUsdt)} USDT`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums text-zinc-300">
                    {live
                      ? r.activeListingsCount != null && r.activeListingsCount > 0
                        ? r.activeListingsCount
                        : "—"
                      : (
                        <span className="rounded-md bg-[#0a0a0a] px-2 py-0.5 text-[11px] text-zinc-300">
                          {formatSecondaryDemandLabel(r.secondaryLabel, locale)}
                        </span>
                      )}
                  </td>
                  <td className="px-3 py-2 align-middle font-mono tabular-nums text-zinc-400">
                    {live
                      ? r.spreadPercent != null
                        ? formatPercentValue(r.spreadPercent, locale)
                        : r.spreadUsdt != null && r.spreadUsdt > 0
                          ? `${formatUsdtCompact(r.spreadUsdt)} USDT`
                          : "—"
                      : "—"}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="font-mono text-[11px] tabular-nums text-zinc-400">{r.liquidityLabel}</span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="flex items-center gap-2">
                      <MarketMiniSparkline values={r.sparkline} trend={r.trend} width={96} height={32} />
                      <span className={cn("font-mono text-[11px] tabular-nums", deltaClass)}>
                        {r.trend === "up" ? "▲" : r.trend === "down" ? "▼" : "■"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle text-right">
                    <span className="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[12px] font-medium">
                      <Link
                        href={catalogBuyUnitsPath(r.id)}
                        className="text-[#B7F500] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("marketOverview.table.buy")}
                      </Link>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-zinc-500">{t("marketOverview.table.empty")}</div>
        ) : null}
      </div>
    </div>
  );
}
