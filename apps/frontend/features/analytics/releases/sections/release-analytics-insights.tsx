"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";

import { ExchangeNeonSparkline, type ExchangeNeonTrend } from "@/components/shared/charts/exchange-neon-sparkline";
import { analyticsReleaseDetailPath } from "@/constants/routes";
import { directionFromChangePct, parseSignedPercentChange } from "@/lib/analytics/change-pct";
import { releaseAnalyticsPeriodLabel } from "@/lib/analytics/period-label";
import { cn } from "@/lib/utils";
import type { ReleaseAnalyticsPeriod, ReleaseAnalyticsRow } from "@/types/analytics/releases";

const shell = "rounded-2xl bg-[#101010] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.42)] md:p-5";
const card = cn("group relative flex h-full min-h-[168px] flex-col overflow-hidden", shell, "transition-colors hover:bg-[#121212]");

function parseYield(y: string) {
  return Number(y.replace("%", "").replace(",", ".").replace("−", "-")) || 0;
}

function sparkVolatility(values: number[]) {
  if (values.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < values.length; i++) sum += Math.abs(values[i]! - values[i - 1]!);
  return sum / (values.length - 1);
}

/** Динамика доходности вокруг headline-значения (%). */
function buildYieldSparkline(values: number[], yieldPct: string): number[] {
  if (values.length < 2) return values;
  const target = parseYield(yieldPct);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const swing = Math.max(target * 0.07, 0.35);
  return values.map((v) => target + ((v - min) / span - 0.5) * swing * 2);
}

/** Сглаженная почти плоская линия — соответствует низкой волатильности. */
function buildStabilitySparkline(values: number[]): number[] {
  if (!values.length) return values;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const smoothed = values.map((_, index) => {
    const window = values.slice(Math.max(0, index - 2), index + 1);
    return window.reduce((sum, v) => sum + v, 0) / window.length;
  });
  return smoothed.map((v) => mean + (v - mean) * 0.1);
}

/** Кумулятивное Δ от первой точки — форма роста/падения по changePct. */
function buildGrowthSparkline(values: number[], changePct: string): number[] {
  if (values.length < 2) return values;
  const change = parseSignedPercentChange(changePct);
  if (Math.abs(change) < 1e-6) {
    return values.map(() => 0);
  }
  const base = values[0] ?? 1;
  return values.map((v) => ((v - base) / Math.max(Math.abs(base), 1e-6)) * 100);
}

type InsightPicks = {
  yield: ReleaseAnalyticsRow;
  stable: ReleaseAnalyticsRow;
  growth: ReleaseAnalyticsRow;
};

function pickInsightRows(rows: ReleaseAnalyticsRow[]): InsightPicks | null {
  if (!rows.length) return null;

  const used = new Set<string>();
  const pickOne = (sorted: ReleaseAnalyticsRow[]): ReleaseAnalyticsRow => {
    const fresh = sorted.find((row) => !used.has(row.id));
    const pick = fresh ?? sorted[0]!;
    used.add(pick.id);
    return pick;
  };

  const byYield = [...rows].sort((a, b) => parseYield(b.yieldPct) - parseYield(a.yieldPct));
  const yieldRow = pickOne(byYield);

  const flatCandidates = rows
    .filter((row) => Math.abs(parseSignedPercentChange(row.changePct)) < 1e-6)
    .sort((a, b) => sparkVolatility(a.sparkline) - sparkVolatility(b.sparkline));
  const byStability = [...rows].sort((a, b) => sparkVolatility(a.sparkline) - sparkVolatility(b.sparkline));
  const stableRow = pickOne(flatCandidates.length ? flatCandidates : byStability);

  const upCandidates = rows
    .filter((row) => parseSignedPercentChange(row.changePct) > 0)
    .sort((a, b) => parseSignedPercentChange(b.changePct) - parseSignedPercentChange(a.changePct));
  const byGrowth = [...rows].sort(
    (a, b) => parseSignedPercentChange(b.changePct) - parseSignedPercentChange(a.changePct),
  );
  const growthRow = pickOne(upCandidates.length ? upCandidates : byGrowth);

  return { yield: yieldRow, stable: stableRow, growth: growthRow };
}

function rowTrend(row: ReleaseAnalyticsRow): ExchangeNeonTrend {
  if (row.trend === "up" || row.trend === "down" || row.trend === "flat") return row.trend;
  return directionFromChangePct(row.changePct);
}

function genreRu(g: ReleaseAnalyticsRow["genre"]) {
  if (g === "hiphop") return "Hip-hop";
  if (g === "pop") return "Pop";
  return "Electronic";
}

function deltaTone(n: number) {
  if (n > 0) return "text-[#B7F500]";
  if (n < 0) return "text-rose-400";
  return "text-sky-400";
}

function InsightCard({
  eyebrow,
  row,
  heroLabel,
  heroValue,
  heroHint,
  showChangeChip = true,
  sparkValues,
  sparkTrend,
}: {
  eyebrow: string;
  row: ReleaseAnalyticsRow;
  heroLabel: string;
  heroValue: string;
  heroHint: string;
  showChangeChip?: boolean;
  sparkValues: number[];
  sparkTrend: ExchangeNeonTrend;
}) {
  const d = parseSignedPercentChange(row.changePct);

  return (
    <Link href={analyticsReleaseDetailPath(row.id)} className={card} title="Открыть карточку релиза">
      <div className="relative flex items-start justify-between gap-3">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">{eyebrow}</div>
        <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-zinc-600 transition group-hover:text-zinc-300">
          <span className="hidden sm:inline">Открыть</span>
          <ChevronRight className="size-3.5 opacity-70" aria-hidden />
        </span>
      </div>

      <div className="relative mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xl font-semibold tracking-tight text-white md:text-2xl">{row.release}</div>
          <div className="mt-1 truncate font-mono text-[12px] text-zinc-500">
            {row.symbol} · {row.artist}
          </div>
          <div className="mt-2 truncate font-mono text-[11px] text-zinc-600">
            {genreRu(row.genre)} · {row.status === "Active" ? "Активен" : row.status === "Paused" ? "Пауза" : "Закрыт"}
          </div>

          <div className="mt-5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">{heroLabel}</div>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-white md:text-[34px]">{heroValue}</div>
              {showChangeChip ? (
                <div className={cn("font-mono text-sm font-semibold tabular-nums", deltaTone(d))}>{row.changePct}</div>
              ) : null}
            </div>
            <div className="mt-2 font-mono text-[11px] text-zinc-600">{heroHint}</div>
          </div>
        </div>

        <div className="relative shrink-0 rounded-2xl bg-black/30 px-3 py-2">
          <ExchangeNeonSparkline
            values={sparkValues}
            trend={sparkTrend}
            width={132}
            height={44}
            detailSegments={5}
          />
        </div>
      </div>
    </Link>
  );
}

export function ReleaseAnalyticsInsights({
  period,
  rows,
  stats,
}: {
  period: ReleaseAnalyticsPeriod;
  rows: ReleaseAnalyticsRow[];
  stats: { avgYield: string; active: string; payouts: string; payoutLag: string };
}) {
  const periodLabel = releaseAnalyticsPeriodLabel(period);

  const picks = React.useMemo(() => pickInsightRows(rows), [rows]);

  const empty = !rows.length;
  const canRenderCards = Boolean(picks);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Инсайты</div>
          <h2 className="mt-1 font-sans text-base font-semibold tracking-tight text-white md:text-lg">Срез выборки</h2>
        </div>
        <div className="shrink-0 rounded-full bg-[#0a0a0a] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {periodLabel} · {rows.length}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {empty ? (
          <div className="lg:col-span-3">
            <div className={cn("items-start", shell)}>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Нет данных</div>
              <p className="mt-2 font-sans text-sm text-zinc-400">Ослабьте фильтры — и инсайты появятся снова.</p>
            </div>
          </div>
        ) : canRenderCards && picks ? (
          <>
            <InsightCard
              eyebrow="Лидер доходности"
              row={picks.yield}
              heroLabel="Доходность"
              heroValue={picks.yield.yieldPct}
              heroHint={`Среднее по сводке: ${stats.avgYield}`}
              sparkValues={buildYieldSparkline(picks.yield.sparkline, picks.yield.yieldPct)}
              sparkTrend={rowTrend(picks.yield)}
            />
            <InsightCard
              eyebrow="Стабильность"
              row={picks.stable}
              heroLabel="Волатильность линии"
              heroValue={sparkVolatility(picks.stable.sparkline).toFixed(2)}
              heroHint={`Лаг выплат: ${stats.payoutLag}`}
              sparkValues={buildStabilitySparkline(picks.stable.sparkline)}
              sparkTrend="flat"
            />
            <InsightCard
              eyebrow="Рост Δ"
              row={picks.growth}
              heroLabel="Изменение Δ"
              heroValue={picks.growth.changePct}
              heroHint={`Доходность ${picks.growth.yieldPct}`}
              showChangeChip={false}
              sparkValues={buildGrowthSparkline(picks.growth.sparkline, picks.growth.changePct)}
              sparkTrend={directionFromChangePct(picks.growth.changePct)}
            />
          </>
        ) : (
          <div className="lg:col-span-3">
            <div className={cn("items-start", shell)}>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Нет данных</div>
              <p className="mt-2 font-sans text-sm text-zinc-400">Не удалось построить инсайты для текущей выборки.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
