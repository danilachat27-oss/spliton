"use client";

import { BarChart3, CalendarDays, Info } from "@/lib/lucide";
import { useMemo, useState } from "react";

import { MetricsDetailChart, type MetricsPoint } from "@/components/dashboard/assets/metrics-charts";
import {
  assetsCardClass,
  assetsPanelClass,
  assetsSegmentActiveClass,
  assetsSegmentIdleClass,
} from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/widget-messages";
import { cn } from "@/lib/utils";

type ViewMode = "calendar" | "chart";

function hash01(seed: number, i: number) {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 10000;
  return x - Math.floor(x);
}

function buildDailyPnLPoints(): MetricsPoint[] {
  const n = 18;
  const out: MetricsPoint[] = [];
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += (hash01(31, i) - 0.46) * 0.014;
    const label = i % 3 === 0 ? `${i + 1}` : "";
    out.push({ label, primary: v });
  }
  return out;
}

export function MetricsDailyBreakdownCard() {
  const { t } = useI18n();
  const [mode, setMode] = useState<ViewMode>("calendar");
  const chartData = useMemo(() => buildDailyPnLPoints(), []);

  const days = [
    t("assets.metrics.dayMon"),
    t("assets.metrics.dayTue"),
    t("assets.metrics.dayWed"),
    t("assets.metrics.dayThu"),
    t("assets.metrics.dayFri"),
    t("assets.metrics.daySat"),
    t("assets.metrics.daySun"),
  ];
  const cells = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <section className={assetsCardClass} aria-label={t("assets.metrics.dailyBreakdownAria")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{t("assets.metrics.dailyBreakdownEyebrow")}</p>
            <span className="text-neutral-400" title={t("assets.metrics.dailyBreakdownMockHint")}>
              <Info className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">{t("assets.metrics.dailyBreakdownTitle")}</h3>
          <p className="text-sm text-neutral-500">{tf(t("assets.metrics.dailyBreakdownSubtitle"), { date: "10.04.2026" })}</p>
          <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-[2.25rem]">0,00 USDT</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setMode("calendar")}
            aria-label={t("assets.metrics.dailyCalendarMode")}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
              mode === "calendar" ? assetsSegmentActiveClass : assetsSegmentIdleClass,
            )}
          >
            <CalendarDays className="size-3.5" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => setMode("chart")}
            aria-label={t("assets.metrics.dailyChartMode")}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
              mode === "chart" ? assetsSegmentActiveClass : assetsSegmentIdleClass,
            )}
          >
            <BarChart3 className="size-3.5" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200/70"
        >
          ‹ 2026-04 ›
        </button>
      </div>

      {mode === "calendar" ? (
        <div className={cn(assetsPanelClass, "grid grid-cols-7 gap-1.5 p-3 sm:p-4")}>
          {days.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-medium text-neutral-500">
              {d}
            </div>
          ))}
          {cells.map((cell) => (
            <div
              key={cell}
              className={cn(
                "rounded-lg py-2 text-center text-[12px] transition-colors",
                cell === 10
                  ? "bg-neutral-100 text-neutral-900"
                  : cell < 6 || (cell >= 13 && cell <= 19)
                    ? "bg-white text-neutral-700"
                    : "text-neutral-400",
              )}
            >
              <div className="font-semibold">{cell}</div>
              <div className="text-[10px] text-neutral-400">0</div>
            </div>
          ))}
        </div>
      ) : (
        <MetricsDetailChart series={chartData} showSecondary={false} valueIsPercent />
      )}
    </section>
  );
}
