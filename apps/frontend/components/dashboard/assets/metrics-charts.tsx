"use client";

import { Info } from "@/lib/lucide";
import { useCallback, useId, useMemo, useRef, useState, type MouseEvent } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { formatNumber, formatPercent, formatUsdtAmount, intlLocaleFor } from "@/lib/i18n/formatters";
import { widgetMonthLabels } from "@/lib/i18n/widget-month-labels";
import { tf } from "@/lib/i18n/widget-messages";
import {
  assetsCardClass,
  assetsPanelClass,
  assetsSegmentActiveClass,
  assetsSegmentIdleClass,
} from "@/components/dashboard/assets/assets-ui";
import { SectionUnavailableState } from "@/components/shared/data-states/section-unavailable-state";
import { useReadOnlySectionError } from "@/hooks/use-read-only-section-error";
import { cn } from "@/lib/utils";

const VIEW_W = 960;
const VIEW_H = 300;
const PAD = { top: 26, right: 20, bottom: 46, left: 56 };

const RANGE_IDS = ["7d", "30d", "90d", "1y"] as const;
const RANGE_KEYS: Record<(typeof RANGE_IDS)[number], string> = {
  "7d": "chart.range7d",
  "30d": "chart.range30d",
  "90d": "chart.range90d",
  "1y": "chart.range1y",
};

function hash01(seed: number, i: number) {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 10000;
  return x - Math.floor(x);
}

export type MetricsPoint = { label: string; primary: number; secondary?: number };

function buildBalanceSeries(n: number, seed: number, months: string[]): MetricsPoint[] {
  let bal = 6200 + hash01(seed, 0) * 200;
  let dep = 0;
  const out: MetricsPoint[] = [];
  for (let i = 0; i < n; i++) {
    bal += Math.sin(i / 2.4 + seed) * 45 + (hash01(seed, i) - 0.4) * 38;
    dep += Math.max(0, hash01(seed, i + 17) * 22 - 4);
    const mi = (i + seed) % 12;
    const label = n > 18 ? (i % 2 === 0 ? months[mi]! : "") : months[mi]!;
    out.push({ label, primary: Math.max(4000, bal), secondary: dep });
  }
  return out;
}

function buildPnlSeries(n: number, seed: number, months: string[]): MetricsPoint[] {
  let v = 0;
  const out: MetricsPoint[] = [];
  for (let i = 0; i < n; i++) {
    v += Math.sin(i / 1.8 + seed) * 0.012 + (hash01(seed, i) - 0.48) * 0.018;
    const mi = (i + seed * 2) % 12;
    const label = n > 20 ? (i % 2 === 0 ? months[mi]! : "") : months[mi]!;
    out.push({ label, primary: v });
  }
  return out;
}

function fmtAxis(n: number, pct: boolean, locale: string) {
  if (pct) {
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n * 100)}%`;
  }
  if (Math.abs(n) >= 1000) {
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 1000)}k`;
  }
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n);
}

type DetailChartProps = {
  series: MetricsPoint[];
  showSecondary?: boolean;
  valueIsPercent?: boolean;
  tooltipPrimaryLabel?: string;
  tooltipValueSuffix?: string;
  tooltipFormatPrimary?: (n: number) => string;
};

export function MetricsDetailChart({
  series,
  showSecondary,
  valueIsPercent,
  tooltipPrimaryLabel,
  tooltipValueSuffix,
  tooltipFormatPrimary,
}: DetailChartProps) {
  const { t, locale } = useI18n();
  const intlTag = intlLocaleFor(locale);
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");

  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = VIEW_H - PAD.top - PAD.bottom;
  const n = series.length;
  const prim = series.map((p) => p.primary);
  const pMin = Math.min(...prim);
  const pMax = Math.max(...prim);
  const padY = (pMax - pMin) * 0.08 || (valueIsPercent ? 0.02 : 80);
  const lo = pMin - padY;
  const hi = pMax + padY;
  const span = Math.max(hi - lo, 1e-9);

  const sec = showSecondary ? series.map((p) => p.secondary ?? 0) : null;
  const sMin = sec ? Math.min(...sec) : 0;
  const sMax = sec ? Math.max(...sec) : 1;
  const sPad = (sMax - sMin) * 0.1 || 1;
  const slo = sMin - sPad;
  const shi = sMax + sPad;
  const sspan = Math.max(shi - slo, 1e-9);

  const xAt = useCallback((i: number) => PAD.left + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1)), [innerW, n]);
  const yP = useCallback((v: number) => PAD.top + innerH - ((v - lo) / span) * innerH, [innerH, lo, span]);
  const yS = useCallback((v: number) => PAD.top + innerH - ((v - slo) / sspan) * innerH, [innerH, slo, sspan]);

  const pickHover = useCallback(
    (clientX: number, clientY: number) => {
      const el = chartRef.current;
      if (!el || n < 1) return null;
      const r = el.getBoundingClientRect();
      const svgX = ((clientX - r.left) / r.width) * VIEW_W;
      const svgY = ((clientY - r.top) / r.height) * VIEW_H;
      if (svgX < PAD.left - 4 || svgX > VIEW_W - PAD.right + 4) return null;
      if (svgY < PAD.top - 2 || svgY > PAD.top + innerH + 2) return null;
      const tVal = (svgX - PAD.left) / innerW;
      if (Number.isNaN(tVal)) return null;
      return Math.round(Math.min(1, Math.max(0, tVal)) * (n <= 1 ? 0 : n - 1));
    },
    [innerH, innerW, n],
  );

  const onMove = (e: MouseEvent<HTMLDivElement>) => setHoverIdx(pickHover(e.clientX, e.clientY));
  const onLeave = () => setHoverIdx(null);

  const tipLabel = tooltipPrimaryLabel ?? (valueIsPercent ? t("metrics.pnlAbs") : t("metrics.tooltipValue"));
  const tipSuffix = tooltipValueSuffix ?? (valueIsPercent ? "" : " USDT");

  const linePrimary = useMemo(() => {
    if (n === 0) return "";
    return series.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yP(p.primary).toFixed(1)}`).join("");
  }, [series, n, xAt, yP]);

  const areaPrimary = useMemo(() => {
    if (!linePrimary || n === 0) return "";
    const x0 = xAt(0);
    const x1 = xAt(n - 1);
    const yb = PAD.top + innerH;
    return `${linePrimary} L${x1.toFixed(1)},${yb.toFixed(1)} L${x0.toFixed(1)},${yb.toFixed(1)} Z`;
  }, [linePrimary, n, xAt, innerH]);

  const lineSecondary = useMemo(() => {
    if (!showSecondary || !sec || n === 0) return "";
    return series.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yS(p.secondary ?? 0).toFixed(1)}`).join("");
  }, [series, n, sec, showSecondary, xAt, yS]);

  const ticks = 6;

  return (
    <div
      ref={chartRef}
      className="relative min-w-0 cursor-crosshair overflow-hidden rounded-2xl bg-neutral-50 px-2 py-2 sm:px-3"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block h-[240px] w-full max-w-full sm:h-[280px]" preserveAspectRatio="xMidYMid meet" role="img">
        <defs>
          <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Array.from({ length: ticks }, (_, i) => {
          const v = lo + (span * i) / (ticks - 1);
          const y = yP(v);
          return (
            <g key={`h-${i}`}>
              <line x1={PAD.left} x2={VIEW_W - PAD.right} y1={y} y2={y} stroke="#e5e5e5" strokeDasharray="2 6" />
              <text x={PAD.left - 8} y={y + 3} textAnchor="end" fill="#a3a3a3" fontSize="10" style={{ fontFamily: "var(--font-app-mono), ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>
                {fmtAxis(v, Boolean(valueIsPercent), intlTag)}
              </text>
            </g>
          );
        })}

        {series.map((_, i) => {
          if (i % 2 !== 0 && i !== n - 1) return null;
          const x = xAt(i);
          return <line key={`v-${i}`} x1={x} x2={x} y1={PAD.top} y2={PAD.top + innerH} stroke="#f0f0f0" strokeWidth={1} />;
        })}

        <path d={areaPrimary} fill={`url(#${gid}-area)`} stroke="none" />
        {lineSecondary ? (
          <path d={lineSecondary} fill="none" stroke="#94a3b8" strokeWidth={1.35} strokeDasharray="4 4" strokeLinecap="round" />
        ) : null}
        <path
          d={linePrimary}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth={2.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${gid}-glow)`}
        />

        {series.map((p, i) => {
          if (!p.label) return null;
          const x = xAt(i);
          const isFirst = i === 0;
          const isLast = i === n - 1;
          let anchor: "start" | "middle" | "end" = "middle";
          let xPos = x;
          if (n <= 1) {
            xPos = PAD.left + innerW / 2;
          } else if (isFirst) {
            anchor = "start";
            xPos = PAD.left + 2;
          } else if (isLast) {
            anchor = "end";
            xPos = PAD.left + innerW - 2;
          }
          return (
            <text key={`xl-${i}`} x={xPos} y={VIEW_H - 12} textAnchor={anchor} fill="#737373" fontSize="10" fontWeight={600}>
              {p.label}
            </text>
          );
        })}

        {showSecondary && sec
          ? Array.from({ length: 4 }, (_, i) => {
              const v = slo + (sspan * i) / 3;
              const y = yS(v);
              return (
                <text key={`sr-${i}`} x={VIEW_W - 8} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="9" style={{ fontFamily: "var(--font-app-mono), monospace" }}>
                  {fmtAxis(v, false, intlTag)}
                </text>
              );
            })
          : null}

        {hoverIdx !== null && n > 0 && (
          <line x1={xAt(hoverIdx)} x2={xAt(hoverIdx)} y1={PAD.top} y2={PAD.top + innerH} stroke="#60a5fa" strokeWidth={1} strokeDasharray="4 4" opacity={0.9} />
        )}
      </svg>

      {hoverIdx !== null && series[hoverIdx] && (
        <div className="pointer-events-none absolute left-3 top-10 z-10 max-w-[220px] rounded-xl bg-white px-3 py-2 text-xs">
          <p className="font-semibold text-neutral-900">
            {series[hoverIdx]!.label || tf(t("metrics.tooltipPoint"), { n: String(hoverIdx + 1) })}
          </p>
          <p className="mt-1 font-mono text-neutral-800">
            {tipLabel}:{" "}
            {tooltipFormatPrimary != null
              ? tooltipFormatPrimary(series[hoverIdx]!.primary)
              : fmtAxis(series[hoverIdx]!.primary, Boolean(valueIsPercent), intlTag)}
            {tipSuffix}
          </p>
          {showSecondary && series[hoverIdx]!.secondary != null ? (
            <p className="font-mono text-neutral-500">
              {t("metrics.inputLabel")} {fmtAxis(series[hoverIdx]!.secondary!, false, intlTag)} USDT
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function MetricsResultsChart() {
  const { t, locale } = useI18n();
  const months = useMemo(() => widgetMonthLabels(t), [t]);
  const [range, setRange] = useState<(typeof RANGE_IDS)[number]>("30d");
  const [pnlMode, setPnlMode] = useState<"abs" | "pct">("abs");

  const series = useMemo(() => {
    const n = range === "7d" ? 12 : range === "30d" ? 22 : range === "90d" ? 18 : 26;
    const seed = range === "7d" ? 2 : range === "30d" ? 5 : range === "90d" ? 8 : 13;
    const raw = buildPnlSeries(n, seed, months);
    if (pnlMode === "pct") return raw;
    return raw.map((p, i) => ({ ...p, primary: p.primary * 4200 + i * 12 }));
  }, [range, pnlMode, months]);

  const headline =
    pnlMode === "pct"
      ? formatPercent(series[series.length - 1]!.primary * 100, locale)
      : formatUsdtAmount(series[series.length - 1]!.primary * 1000, locale);

  return (
    <section className={cn(assetsCardClass, "space-y-6")} aria-label={t("metrics.pnlAria")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Metrics · PnL</p>
            <span className="text-neutral-400" title={t("metrics.mockHint")}>
              <Info className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">{t("metrics.pnlTitle")}</h3>
          <p className="text-sm text-neutral-500">{t("metrics.pnlSubtitle")}</p>
          <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-[2.25rem]">{headline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-neutral-100 p-1" role="tablist" aria-label={t("metrics.pnlScaleAria")}>
            {(
              [
                { id: "abs" as const, label: t("metrics.pnlAbs") },
                { id: "pct" as const, label: t("metrics.pnlPct") },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={pnlMode === item.id}
                onClick={() => setPnlMode(item.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
                  pnlMode === item.id ? assetsSegmentActiveClass : assetsSegmentIdleClass,
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl bg-neutral-100 p-1" role="tablist" aria-label={t("metrics.intervalAria")}>
            {RANGE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={range === id}
                onClick={() => setRange(id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
                  range === id ? assetsSegmentActiveClass : assetsSegmentIdleClass,
                )}
              >
                {t(RANGE_KEYS[id])}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MetricsDetailChart series={series} showSecondary={false} valueIsPercent={pnlMode === "pct"} />

      <div className="flex items-center justify-between border-t border-neutral-100 pt-4 text-[11px] text-neutral-500">
        <span>19.03.2026</span>
        <span>17.04.2026</span>
      </div>
    </section>
  );
}

export function MetricsAssetDynamicsChart({
  liveSeries,
  liveLoading,
  liveEmpty,
  liveError,
  onRetry,
  isLiveMode = false,
  cashflowTotals,
  cashflowLoading,
  cashflowError,
  dataSourceLabel,
  compact = false,
}: {
  liveSeries?: MetricsPoint[] | null;
  liveLoading?: boolean;
  liveEmpty?: boolean;
  liveError?: string | null;
  onRetry?: () => void;
  isLiveMode?: boolean;
  cashflowTotals?: { deposits30d: number; withdrawals30d: number } | null;
  cashflowLoading?: boolean;
  cashflowError?: string | null;
  dataSourceLabel?: string;
  compact?: boolean;
} = {}) {
  const { t, locale } = useI18n();
  const months = useMemo(() => widgetMonthLabels(t), [t]);
  const [range, setRange] = useState<(typeof RANGE_IDS)[number]>("30d");

  const mockSeries = useMemo(() => {
    const n = range === "7d" ? 14 : range === "30d" ? 24 : range === "90d" ? 20 : 28;
    const seed = 17;
    return buildBalanceSeries(n, seed, months);
  }, [range, months]);

  const useLive = isLiveMode && liveSeries != null && liveSeries.length > 0;
  const showMock = !isLiveMode;
  const series = useLive ? liveSeries! : showMock ? mockSeries : [];

  const tvl = useLive
    ? Math.round(series[series.length - 1]?.primary ?? 0)
    : showMock
      ? Math.round(mockSeries[mockSeries.length - 1]?.primary ?? 0)
      : 0;

  useReadOnlySectionError("metrics-asset-dynamics-chart", liveError, onRetry);

  return (
    <section
      className={cn(compact ? assetsCardClass : assetsCardClass, "space-y-5 sm:space-y-6")}
      aria-label={t("metrics.balanceAria")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          {!compact ? (
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Metrics · Balance</p>
              {!useLive && showMock ? (
                <span className="text-neutral-400" title={t("metrics.demoWalletHint")}>
                  <Info className="size-3.5" strokeWidth={2} aria-hidden />
                </span>
              ) : null}
            </div>
          ) : null}
          <h3 className={cn("font-semibold tracking-tight text-neutral-900", compact ? "text-base sm:text-lg" : "text-lg sm:text-xl")}>
            {t("metrics.balanceTitle")}
          </h3>
          {!compact ? (
            <p className="text-sm text-neutral-500">
              {dataSourceLabel ??
                (useLive
                  ? t("metrics.balanceSubtitleLive")
                  : showMock
                    ? t("metrics.balanceSubtitleDemo")
                    : t("metrics.balanceSubtitleLive"))}
            </p>
          ) : (
            <p className="text-sm text-neutral-500">{t("overview.estimatedBalanceLabel")}</p>
          )}
          <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-[2.25rem]">
            {tvl > 0 ? (
              <>
                {formatNumber(tvl, locale)}{" "}
                <span className="text-base font-sans font-medium text-neutral-400">USDT</span>
              </>
            ) : (
              <span className="text-base font-sans font-medium text-neutral-500">{t("common.emptyBalance")}</span>
            )}
          </p>
        </div>
        <div className="flex rounded-xl bg-neutral-100 p-1" role="tablist" aria-label={t("metrics.intervalAria")}>
          {RANGE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={range === id}
              onClick={() => setRange(id)}
              className={cn(
                "rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
                range === id ? assetsSegmentActiveClass : assetsSegmentIdleClass,
              )}
            >
              {t(RANGE_KEYS[id])}
            </button>
          ))}
        </div>
      </div>

      {liveLoading ? (
        <p className="py-12 text-center text-sm text-neutral-500">{t("assets.loadingChart")}</p>
      ) : liveError ? (
        <SectionUnavailableState onRetry={onRetry} />
      ) : isLiveMode && liveEmpty && !useLive ? (
        <p className={cn(assetsPanelClass, "px-4 py-10 text-center text-sm text-neutral-500")}>
          {t("chart.noHistory")} {t("chart.noHistoryHint")}
        </p>
      ) : series.length > 0 ? (
        <MetricsDetailChart series={series} showSecondary={showMock && !useLive} valueIsPercent={false} />
      ) : (
        <p className={cn(assetsPanelClass, "px-4 py-10 text-center text-sm text-neutral-500")}>
          {t("chart.noHistory")}
        </p>
      )}

      <div className="grid gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-2">
        <div className={cn(assetsPanelClass, "px-4 py-4")}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("chart.deposits30d")}</p>
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-neutral-900">
            {showMock ? (
              <>+1 240,00 USDT</>
            ) : cashflowLoading ? (
              "…"
            ) : cashflowError ? (
              t("common.emptyAmount")
            ) : cashflowTotals ? (
              <>+{formatUsdtAmount(cashflowTotals.deposits30d, locale).replace(" USDT", "")} USDT</>
            ) : (
              t("common.emptyAmount")
            )}
          </p>
          {showMock ? <p className="mt-1 text-[10px] text-neutral-400">{t("assets.demoLabel")}</p> : null}
          {!showMock && cashflowError ? (
            <p className="mt-1 text-[10px] text-neutral-500">{t("chart.dataUnavailable")}</p>
          ) : null}
        </div>
        <div className={cn(assetsPanelClass, "px-4 py-4")}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("chart.withdrawals30d")}</p>
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-neutral-900">
            {showMock ? (
              <>−860,00 USDT</>
            ) : cashflowLoading ? (
              "…"
            ) : cashflowError ? (
              t("common.emptyAmount")
            ) : cashflowTotals ? (
              <>−{formatUsdtAmount(cashflowTotals.withdrawals30d, locale).replace(" USDT", "")} USDT</>
            ) : (
              t("common.emptyAmount")
            )}
          </p>
          {showMock ? <p className="mt-1 text-[10px] text-neutral-400">{t("assets.demoLabel")}</p> : null}
          {!showMock && cashflowError ? (
            <p className="mt-1 text-[10px] text-neutral-500">{t("chart.dataUnavailable")}</p>
          ) : null}
        </div>
      </div>

      {showMock ? (
        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span>19.03.2026</span>
          <span>17.04.2026</span>
        </div>
      ) : cashflowTotals ? (
        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span>{t("chart.last30days")}</span>
          <span>{t("assets.metrics.walletActivity")}</span>
        </div>
      ) : null}
    </section>
  );
}
