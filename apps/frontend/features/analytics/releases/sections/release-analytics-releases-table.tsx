"use client";

import { useRouter } from "next/navigation";
import { Star } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { SortHeader } from "@/components/shared/exchange/sort-header";
import { analyticsReleaseDetailPath } from "@/constants/routes";
import { directionFromChangePct } from "@/lib/analytics/change-pct";
import { analyticsReleaseStatusLabel } from "@/lib/i18n/analytics-messages";
import { cn } from "@/lib/utils";
import type { ReleaseAnalyticsRow, ReleaseAnalyticsSortKey } from "@/types/analytics/releases";

import { ReleasePayoutRangeBar } from "../ui/release-payout-range-bar";
import { ReleaseSparkline } from "../ui/release-sparkline";

export function ReleaseAnalyticsReleasesTable({
  rows,
  sort,
  sortDir,
  onSort,
  watch,
  onToggleWatch,
}: {
  rows: ReleaseAnalyticsRow[];
  sort: ReleaseAnalyticsSortKey;
  sortDir: "asc" | "desc";
  onSort: (k: ReleaseAnalyticsSortKey) => void;
  watch: Record<string, boolean>;
  onToggleWatch: (id: string) => void;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();

  return (
    <div className="mt-5 overflow-hidden rounded-xl bg-[#111111]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left font-mono text-[13px] tabular-nums tracking-tight">
          <thead>
            <tr className="text-zinc-500">
              <th className="w-9 py-3 pr-1 pl-3" aria-label={t("analytics.releases.table.localMarkAria")} />
              <th className="py-3 pr-4 font-normal">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{t("analytics.releases.table.name")}</span>
              </th>
              <th className="py-3 pr-3">
                <SortHeader
                  tone="neutral"
                  label={t("analytics.releases.table.yield")}
                  active={sort === "yield"}
                  dir={sort === "yield" ? sortDir : "desc"}
                  onClick={() => onSort("yield")}
                />
              </th>
              <th className="py-3 pr-3 text-right">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">Δ</span>
              </th>
              <th className="py-3 pr-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{t("analytics.releases.table.dynamics")}</span>
              </th>
              <th className="py-3 pr-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{t("analytics.releases.table.corridor")}</span>
              </th>
              <th className="py-3 pr-3">
                <SortHeader
                  tone="neutral"
                  label={t("analytics.releases.table.payouts")}
                  active={sort === "payouts"}
                  dir={sort === "payouts" ? sortDir : "desc"}
                  onClick={() => onSort("payouts")}
                  align="right"
                />
              </th>
              <th className="py-3 pr-4">
                <SortHeader
                  tone="neutral"
                  label="Units"
                  active={sort === "units"}
                  dir={sort === "units" ? sortDir : "desc"}
                  onClick={() => onSort("units")}
                />
              </th>
              <th className="py-3 pr-3 font-normal">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">Progress</span>
              </th>
              <th className="py-3 pr-3 font-normal">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">Raised</span>
              </th>
              <th className="py-3 pr-3 font-normal">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">Holders</span>
              </th>
              <th className="py-3 pr-4 pl-0 font-normal">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{t("analytics.releases.table.status")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const watched = !!watch[r.id];
              const deltaDir = directionFromChangePct(r.changePct);
              const deltaClass =
                deltaDir === "up"
                  ? "text-[#B7F500]"
                  : deltaDir === "down"
                    ? "text-rose-400"
                    : "text-sky-400";
              const go = () => router.push(analyticsReleaseDetailPath(r.id));
              return (
                <tr
                  key={r.id}
                  tabIndex={0}
                  aria-label={t("analytics.releases.table.openReleaseAria").replace("{name}", r.release)}
                  className="cursor-pointer text-zinc-300 transition-colors hover:bg-white/4"
                  onClick={go}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      go();
                    }
                  }}
                >
                  <td className="py-2.5 pl-3 pr-1 align-middle">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatch(r.id);
                      }}
                      className="flex size-8 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-300"
                      aria-label={
                        watched
                          ? t("analytics.releases.table.watchRemoveAria")
                          : t("analytics.releases.table.watchAddAria")
                      }
                      title={t("analytics.releases.table.watchTitle")}
                    >
                      <Star
                        className={cn(
                          "size-4",
                          watched ? "fill-amber-400/20 text-amber-300/90" : "fill-none",
                        )}
                        strokeWidth={1.5}
                      />
                    </button>
                  </td>
                  <td className="py-2.5 pr-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#0a0a0a] text-[10px] font-semibold uppercase text-zinc-500">
                        {r.symbol.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                          <span className="font-semibold tracking-tight text-white">{r.symbol}</span>
                          <span className="truncate font-sans text-[12px] text-zinc-500">{r.release}</span>
                        </div>
                        <div className="font-sans text-[11px] text-zinc-600">{r.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 align-middle">
                    <span className="font-semibold text-zinc-100">{r.yieldPct}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-right align-middle">
                    <span className={cn("text-[13px] font-medium", deltaClass)}>{r.changePct}</span>
                  </td>
                  <td className="py-2.5 pr-4 align-middle">
                    <ReleaseSparkline values={r.sparkline} trend={r.trend} changePct={r.changePct} />
                  </td>
                  <td className="py-2.5 pr-4 align-middle">
                    <ReleasePayoutRangeBar {...r.payoutBand} />
                  </td>
                  <td className="py-2.5 pr-3 align-middle text-white">{r.payouts}</td>
                  <td className="py-2.5 pr-4 align-middle text-zinc-400">{r.units}</td>
                  <td className="py-2.5 pr-3 align-middle text-zinc-400">
                    {r.progressPercent != null ? `${Math.round(r.progressPercent)}%` : "—"}
                  </td>
                  <td className="py-2.5 pr-3 align-middle text-zinc-300">{r.raisedUsdt ?? "—"}</td>
                  <td className="py-2.5 pr-3 align-middle text-zinc-300">
                    {r.holdersCount != null ? r.holdersCount : "—"}
                  </td>
                  <td className="py-2.5 pr-4 align-middle font-sans text-[12px] text-zinc-500">
                    {analyticsReleaseStatusLabel(r.status, locale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <div className="py-12 text-center font-sans text-[13px] text-zinc-500">{t("analytics.releases.table.empty")}</div>
      ) : null}
    </div>
  );
}
