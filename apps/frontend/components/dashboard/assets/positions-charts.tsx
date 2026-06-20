"use client";

import { Info } from "@/lib/lucide";
import { useMemo, useState } from "react";

import { MetricsDetailChart, type MetricsPoint } from "@/components/dashboard/assets/metrics-charts";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const RANGE_PRESETS = [
  { id: "7d", label: "7 дн." },
  { id: "30d", label: "30 дн." },
  { id: "90d", label: "90 дн." },
  { id: "1y", label: "1 г." },
] as const;

function hash01(seed: number, i: number) {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 10000;
  return x - Math.floor(x);
}

const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

/** Плавный мок-ряд к заданной оценке портфеля (USDT) — конец совпадает с текущим срезом. */
function buildPortfolioValueSeries(endUsdt: number, n: number): MetricsPoint[] {
  const end = Math.max(endUsdt, 1);
  const start = end * (0.58 + hash01(11, 0) * 0.18);
  const out: MetricsPoint[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1);
    const anchor = start + (end - start) * Math.pow(t, 0.82);
    v = v * 0.48 + anchor * 0.52 + Math.sin(i * 0.55 + 2.1) * end * 0.012 + (hash01(19, i) - 0.5) * end * 0.006;
    const mi = (i + 4) % 12;
    const label = n > 18 ? (i % 2 === 0 ? months[mi]! : "") : months[mi]!;
    out.push({ label, primary: Math.max(end * 0.48, v) });
  }
  out[n - 1] = { ...out[n - 1]!, label: out[n - 1]!.label || months[(n + 3) % 12]!, primary: end };
  return out;
}

/** Мок динамики суммарного количества units — конец = текущий срез по фильтру. */
function buildUnitsSeries(endUnits: number, n: number): MetricsPoint[] {
  const end = Math.max(Math.round(endUnits), 1);
  const start = Math.max(Math.round(end * (0.52 + hash01(7, 1) * 0.22)), 1);
  const out: MetricsPoint[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1);
    const anchor = start + (end - start) * Math.pow(t, 0.9);
    v = Math.round(v * 0.5 + anchor * 0.5 + Math.sin(i * 0.7) * end * 0.04);
    const mi = (i + 7) % 12;
    const label = n > 18 ? (i % 2 === 0 ? months[mi]! : "") : months[mi]!;
    out.push({ label, primary: Math.max(1, v) });
  }
  out[n - 1] = { ...out[n - 1]!, primary: end };
  return out;
}

function countForRange(range: string) {
  if (range === "7d") return 12;
  if (range === "30d") return 18;
  if (range === "90d") return 22;
  return 26;
}

export function PositionsPortfolioValueChart({ portfolioUsdt }: { portfolioUsdt: number }) {
  const { t } = useI18n();
  const [range, setRange] = useState<(typeof RANGE_PRESETS)[number]["id"]>("90d");

  const series = useMemo(() => {
    const n = countForRange(range);
    return buildPortfolioValueSeries(portfolioUsdt, n);
  }, [range, portfolioUsdt]);

  const headline = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(portfolioUsdt));

  return (
    <section className="space-y-6 rounded-3xl bg-white px-5 py-6 sm:space-y-8 sm:px-7 sm:py-8" aria-label="Оценка портфеля">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Positions · Valuation</p>
            <span className="text-neutral-400" title="Ряд согласован с суммой оценок по текущему фильтру; траектория — мок.">
              <Info className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Оценка портфеля</h3>
          <p className="text-sm text-neutral-500">Сумма текущих оценок позиций в выборке</p>
          <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-[2.25rem]">
            {headline} <span className="text-base font-sans font-medium text-neutral-400">USDT</span>
          </p>
        </div>
        <div className="flex rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Интервал графика">
          {RANGE_PRESETS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={range === r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
                range === r.id ? "bg-white text-neutral-900 ring-1 ring-neutral-200/80" : "text-neutral-500 hover:text-neutral-800",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <MetricsDetailChart
        series={series}
        showSecondary={false}
        valueIsPercent={false}
        tooltipPrimaryLabel="Оценка"
        tooltipValueSuffix=" USDT"
      />

      <div className="flex items-center justify-between border-t border-neutral-100 pt-4 text-[11px] text-neutral-500">
        <span>{t("positions.chart.periodStart")}</span>
        <span>{t("positions.chart.periodEnd")}</span>
      </div>
    </section>
  );
}

export function PositionsUnitsTrajectoryChart({ totalUnits }: { totalUnits: number }) {
  const { t } = useI18n();
  const [range, setRange] = useState<(typeof RANGE_PRESETS)[number]["id"]>("30d");

  const series = useMemo(() => {
    const n = countForRange(range);
    return buildUnitsSeries(totalUnits, n);
  }, [range, totalUnits]);

  const headline = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(totalUnits));

  return (
    <section className="space-y-6 rounded-3xl bg-white px-5 py-6 sm:space-y-8 sm:px-7 sm:py-8" aria-label="Units в портфеле">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Positions · Units</p>
            <span className="text-neutral-400" title="Итог по оси совпадает с суммой units в таблице; форма ряда — мок.">
              <Info className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Units в портфеле</h3>
          <p className="text-sm text-neutral-500">Совокупный объём units в текущей выборке</p>
          <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-[2.25rem]">
            {headline} <span className="text-base font-sans font-medium text-neutral-400">UNT</span>
          </p>
        </div>
        <div className="flex rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Интервал графика">
          {RANGE_PRESETS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={range === r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
                range === r.id ? "bg-white text-neutral-900 ring-1 ring-neutral-200/80" : "text-neutral-500 hover:text-neutral-800",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <MetricsDetailChart
        series={series}
        showSecondary={false}
        valueIsPercent={false}
        tooltipPrimaryLabel="Units"
        tooltipValueSuffix=""
        tooltipFormatPrimary={(n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n))}
      />

      <div className="flex items-center justify-between border-t border-neutral-100 pt-4 text-[11px] text-neutral-500">
        <span>{t("positions.chart.periodStart")}</span>
        <span>{t("positions.chart.periodEnd")}</span>
      </div>
    </section>
  );
}
