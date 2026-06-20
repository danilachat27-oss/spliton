"use client";

import { Info } from "@/lib/lucide";
import type { MouseEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatNumber } from "@/lib/i18n/formatters";
import { widgetMonthLabels } from "@/lib/i18n/widget-month-labels";
import { tf } from "@/lib/i18n/widget-messages";

type RangeId = "30d" | "90d" | "1y" | "all";

type MonthPoint = {
  label: string;
  netUSDT: number;
  navUSDT: number;
};

const RANGE_CONFIG: { id: RangeId; key: string }[] = [
  { id: "30d", key: "chart.range30d" },
  { id: "90d", key: "chart.range90d" },
  { id: "1y", key: "chart.range1y" },
  { id: "all", key: "assets.overview.rangeAll" },
];

const VIEW_W = 960;
const VIEW_H = 320;
const PAD = { top: 26, right: 58, bottom: 46, left: 62 };

function hash01(seed: number, i: number) {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 10000;
  return x - Math.floor(x);
}

function buildSeries(range: RangeId, months: string[]): MonthPoint[] {
  const n = range === "30d" ? 14 : range === "90d" ? 18 : range === "1y" ? 16 : 28;
  const seed = range === "30d" ? 3 : range === "90d" ? 7 : range === "1y" ? 11 : 19;
  const out: MonthPoint[] = [];
  let nav = 5800 + hash01(seed, 0) * 400;
  for (let i = 0; i < n; i++) {
    const wave = Math.sin(i / 2.1 + seed) * 420 + Math.cos(i / 1.4) * 180;
    const spike = (i === 7 || i === 14 ? 380 : 0) * hash01(seed, i + 40);
    const net = Math.round(wave + spike + (hash01(seed, i) - 0.45) * 520);
    nav += net * 0.08 + hash01(seed, i + 99) * 40 - 15;
    const mi = (19 - i + Math.floor(seed)) % 12;
    const showLabel = n <= 16 ? true : i % 2 === 0 || i === n - 1;
    const label = showLabel ? months[mi]! : "";
    out.push({ label, netUSDT: net, navUSDT: Math.max(3200, nav) });
  }
  return out;
}

function fmtKpiSigned(n: number, locale: Parameters<typeof formatNumber>[1]) {
  const abs = formatNumber(Math.abs(n), locale);
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

function fmtNavAxis(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(2).replace(".", ",")}k`;
  return String(Math.round(n));
}

function fmtNetAxis(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")}k`;
  return String(Math.round(n));
}

export function OverviewEtfFlowsChart() {
  const { t, locale } = useI18n();
  const months = useMemo(() => widgetMonthLabels(t), [t]);
  const chartRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<RangeId>("all");
  const [mode, setMode] = useState<"portfolio" | "usdt">("portfolio");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const series = useMemo(() => {
    const base = buildSeries(range, months);
    const m = mode === "usdt" ? 1 : 1.08;
    return base.map((p) => ({
      ...p,
      netUSDT: Math.round(p.netUSDT * m),
      navUSDT: p.navUSDT * (mode === "usdt" ? 1 : 1.02),
    }));
  }, [range, mode, months]);

  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = VIEW_H - PAD.top - PAD.bottom;
  const n = series.length;

  const navVals = series.map((p) => p.navUSDT);
  const netVals = series.map((p) => p.netUSDT);
  const navMin = Math.min(...navVals);
  const navMax = Math.max(...navVals);
  const navPad = (navMax - navMin) * 0.06 || 1;
  const navLo = navMin - navPad;
  const navHi = navMax + navPad;
  const navSpan = Math.max(navHi - navLo, 1);

  const netMin = Math.min(...netVals);
  const netMax = Math.max(...netVals);
  const netPad = (netMax - netMin) * 0.12 || 200;
  const netLo = netMin - netPad;
  const netHi = netMax + netPad;
  const netSpan = Math.max(netHi - netLo, 1);

  const xAt = useCallback((i: number) => PAD.left + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1)), [innerW, n]);
  const yNav = useCallback(
    (v: number) => PAD.top + innerH - ((v - navLo) / navSpan) * innerH,
    [innerH, navLo, navSpan],
  );
  const yNet = useCallback(
    (v: number) => PAD.top + innerH - ((v - netLo) / netSpan) * innerH,
    [innerH, netLo, netSpan],
  );

  const pickHover = useCallback(
    (clientX: number, clientY: number) => {
      const el = chartRef.current;
      if (!el || n < 1) return null;
      const r = el.getBoundingClientRect();
      const svgX = ((clientX - r.left) / r.width) * VIEW_W;
      const svgY = ((clientY - r.top) / r.height) * VIEW_H;
      if (svgX < PAD.left - 4 || svgX > VIEW_W - PAD.right + 4) return null;
      if (svgY < PAD.top - 2 || svgY > PAD.top + innerH + 2) return null;
      const t = (svgX - PAD.left) / innerW;
      if (Number.isNaN(t)) return null;
      return Math.round(Math.min(1, Math.max(0, t)) * (n <= 1 ? 0 : n - 1));
    },
    [innerH, innerW, n],
  );

  const onChartMove = (e: MouseEvent<HTMLDivElement>) => {
    setHoverIdx(pickHover(e.clientX, e.clientY));
  };

  const onChartLeave = () => {
    setHoverIdx(null);
  };

  const lineNav = useMemo(() => {
    if (n === 0) return "";
    return series
      .map((p, i) => {
        const x = xAt(i);
        const y = yNav(p.navUSDT);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("");
  }, [series, n, xAt, yNav]);

  const lineNet = useMemo(() => {
    if (n === 0) return "";
    return series
      .map((p, i) => {
        const x = xAt(i);
        const y = yNet(p.netUSDT);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("");
  }, [series, n, xAt, yNet]);

  const areaNav = useMemo(() => {
    if (n === 0) return "";
    const line = lineNav;
    const x0 = xAt(0);
    const x1 = xAt(n - 1);
    const yb = PAD.top + innerH;
    return `${line} L${x1.toFixed(1)},${yb.toFixed(1)} L${x0.toFixed(1)},${yb.toFixed(1)} Z`;
  }, [lineNav, n, xAt, innerH]);

  const navTicks = 6;
  const netTicks = 5;

  const sumNet = series.reduce((a, p) => a + p.netUSDT, 0);
  const lastNet = series[n - 1]?.netUSDT ?? 0;
  const secondHalf = series.slice(Math.ceil(n / 2));
  const net30 = secondHalf.reduce((a, p) => a + p.netUSDT, 0);
  const dailyMock = Math.round(lastNet * 0.12 + 80);
  const volumeMock = Math.round(sumNet * 2.4 + 12800);
  const tvl = Math.round(series[n - 1]!.navUSDT);
  const mcapPct = ((tvl / 65200) * 100).toFixed(2).replace(".", ",");

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ring-1 ring-neutral-100/80">
      <div className="flex flex-col gap-4 border-b border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{t("assets.overview.flowsEyebrow")}</p>
            <span className="text-neutral-400" title={t("assets.overview.flowsMockHint")}>
              <Info className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">{t("assets.overview.flowsTitle")}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-neutral-100 p-1" role="tablist" aria-label={t("assets.overview.flowsModeAria")}>
            {(
              [
                { id: "portfolio" as const, label: t("assets.overview.flowsModePortfolio") },
                { id: "usdt" as const, label: "USDT" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
                  mode === tab.id ? "bg-white text-neutral-900 ring-1 ring-neutral-200/80" : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl bg-neutral-100 p-1" role="tablist" aria-label={t("assets.overview.flowsPeriodAria")}>
            {RANGE_CONFIG.map((r) => (
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
                {t(r.key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-neutral-100 px-4 py-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 sm:px-6">
        {[
          { label: t("assets.overview.kpiNetLastPoint"), value: `${fmtKpiSigned(dailyMock, locale)} USDT`, tone: dailyMock >= 0 ? "text-blue-700" : "text-neutral-600" },
          { label: t("assets.overview.kpiNetWindow"), value: `${fmtKpiSigned(net30, locale)} USDT`, tone: net30 >= 0 ? "text-blue-700" : "text-neutral-600" },
          { label: t("assets.overview.kpiCumulativeMock"), value: `${fmtKpiSigned(sumNet, locale)} USDT`, tone: "text-neutral-900" },
          { label: t("assets.overview.kpiVolumeMock"), value: `${formatNumber(volumeMock, locale)} USDT`, tone: "text-neutral-800" },
          { label: t("assets.overview.kpiTvl"), value: `${formatNumber(tvl, locale)} USDT`, tone: "text-neutral-900" },
          { label: t("assets.overview.kpiBenchmarkShare"), value: `${mcapPct}%`, tone: "text-neutral-500" },
        ].map((k) => (
          <div key={k.label} className="min-w-0 rounded-2xl bg-neutral-50/90 px-3 py-2.5 ring-1 ring-neutral-100 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{k.label}</p>
            <p className={cn("mt-1 truncate font-mono text-sm font-semibold tabular-nums sm:text-base", k.tone)}>{k.value}</p>
          </div>
        ))}
      </div>

      <div
        ref={chartRef}
        className="relative min-w-0 cursor-crosshair overflow-hidden px-3 pb-2 pt-3 sm:px-5"
        onMouseMove={onChartMove}
        onMouseLeave={onChartLeave}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="block h-[260px] w-full max-w-full sm:h-[300px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t("assets.overview.flowsChartAria")}
        >
          <defs>
            <linearGradient id="overviewNavAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#93c5fd" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="overviewNavLineGlow" x="-12%" y="-12%" width="124%" height="124%">
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {Array.from({ length: navTicks }, (_, i) => {
            const v = navLo + (navSpan * i) / (navTicks - 1);
            const y = yNav(v);
            return (
              <g key={`gh-${i}`}>
                <line x1={PAD.left} x2={VIEW_W - PAD.right} y1={y} y2={y} stroke="#e5e5e5" strokeWidth={1} strokeDasharray="2 6" />
                <text
                  x={PAD.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#a3a3a3"
                  fontSize="10"
                  style={{ fontFamily: "var(--font-app-mono), ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}
                >
                  {fmtNavAxis(v)}
                </text>
              </g>
            );
          })}

          {series.map((_, i) => {
            if (i % 2 !== 0 && i !== n - 1) return null;
            const x = xAt(i);
            return (
              <line key={`gv-${i}`} x1={x} x2={x} y1={PAD.top} y2={PAD.top + innerH} stroke="#f0f0f0" strokeWidth={1} />
            );
          })}

          <path d={areaNav} fill="url(#overviewNavAreaFill)" stroke="none" />
          <path
            d={lineNet}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.4}
            strokeDasharray="4 4"
            strokeLinecap="round"
            opacity={0.95}
          />
          <path
            d={lineNav}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#overviewNavLineGlow)"
          />

          {series.map((p, i) => {
            if (!p.label) return null;
            const x = xAt(i);
            const isFirst = i === 0;
            const isLast = i === n - 1;
            let anchor: "start" | "middle" | "end" = "middle";
            let xPos = x;
            if (n <= 1) {
              anchor = "middle";
              xPos = PAD.left + innerW / 2;
            } else if (isFirst) {
              anchor = "start";
              xPos = PAD.left + 2;
            } else if (isLast) {
              anchor = "end";
              xPos = PAD.left + innerW - 2;
            }
            return (
              <text
                key={`xl-${i}`}
                x={xPos}
                y={VIEW_H - 12}
                textAnchor={anchor}
                fill="#737373"
                fontSize="10"
                fontWeight={600}
                style={{ fontFamily: "var(--font-app-mono), ui-monospace, monospace" }}
              >
                {p.label}
              </text>
            );
          })}

          <text
            x={PAD.left - 8}
            y={PAD.top - 6}
            textAnchor="end"
            fill="#a3a3a3"
            fontSize="9"
            fontWeight={600}
            className="uppercase tracking-wide"
          >
            {t("assets.overview.axisTvl")}
          </text>
          <text
            x={VIEW_W - PAD.right + 8}
            y={PAD.top - 6}
            textAnchor="start"
            fill="#a3a3a3"
            fontSize="9"
            fontWeight={600}
            className="uppercase tracking-wide"
          >
            {t("assets.overview.axisFlow")}
          </text>

          {Array.from({ length: netTicks }, (_, i) => {
            const v = netLo + (netSpan * i) / (netTicks - 1);
            const y = yNet(v);
            return (
              <text
                key={`nr-${i}`}
                x={VIEW_W - PAD.right + 8}
                y={y + 3}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="9"
                style={{ fontFamily: "var(--font-app-mono), ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}
              >
                {fmtNetAxis(v)}
              </text>
            );
          })}

          {hoverIdx !== null && n > 0 && (
            <line
              x1={xAt(hoverIdx)}
              x2={xAt(hoverIdx)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="#60a5fa"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.85}
            />
          )}
        </svg>

        {hoverIdx !== null && series[hoverIdx] && (
          <div className="pointer-events-none absolute left-3 top-10 z-10 max-w-[240px] rounded-xl border border-neutral-200 bg-white/95 px-3 py-2.5 text-xs shadow-lg ring-1 ring-neutral-100 backdrop-blur-sm">
            <p className="font-semibold text-neutral-900">{series[hoverIdx]!.label || tf(t("metrics.tooltipPoint"), { n: String(hoverIdx + 1) })}</p>
            <p className="mt-1 font-mono text-neutral-700">
              {t("assets.overview.axisTvl")}:{" "}
              <span className="font-semibold text-neutral-900">
                {formatNumber(Math.round(series[hoverIdx]!.navUSDT), locale)} USDT
              </span>
            </p>
            <p className="font-mono text-neutral-600">
              {t("assets.overview.axisFlow")}: {fmtKpiSigned(series[hoverIdx]!.netUSDT, locale)} USDT
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8 border-t border-neutral-100 px-4 py-3 text-[11px] text-neutral-500">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-6 rounded-sm bg-linear-to-r from-blue-600 to-blue-400" aria-hidden />
          {t("assets.overview.legendNav")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-px w-7 border-t-2 border-dashed border-slate-400" aria-hidden />
          {t("assets.overview.legendNet")}
        </span>
      </div>
    </div>
  );
}
