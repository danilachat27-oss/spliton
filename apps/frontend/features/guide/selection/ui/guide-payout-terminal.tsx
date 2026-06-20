"use client";

import { useMemo } from "react";

import { GUIDE_PAYOUT_SERIES } from "@/constants/guide/selection";
import { useI18n } from "@/components/providers/i18n-provider";

import "./guide-payout-terminal.css";

type ChartPoint = {
  xLabel: string;
  value: number;
  amountLabel: string;
  status: "released" | "accrued";
  statusLabel: string;
};

function formatAxisUsdt(v: number) {
  return v % 1 === 0 ? `${v}` : v.toFixed(1);
}

function buildChartGeometry(values: number[]) {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(rawMax - rawMin, 0.8);
  const minV = rawMin - span * 0.15;
  const maxV = rawMax + span * 0.15;
  const w = 400;
  const h = 160;
  const pad = { t: 12, r: 16, b: 12, l: 4 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const yAt = (v: number) => pad.t + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const xAt = (i: number, count: number) => pad.l + (i / Math.max(count - 1, 1)) * innerW;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = minV + (i / ticks) * (maxV - minV);
    const y = yAt(v);
    const pct = (y / h) * 100;
    return { v, pct, y };
  });

  return { w, h, pad, innerW, innerH, yAt, xAt, yTicks, bandTop: yAt(rawMax), bandBottom: yAt(rawMin) };
}

export function GuidePayoutTerminal({ series }: { series: ChartPoint[] }) {
  const { t } = useI18n();
  const values = series.map((s) => s.value);
  const geo = useMemo(() => buildChartGeometry(values), [values]);

  const linePath = series
    .map((s, i) => `${i === 0 ? "M" : "L"} ${geo.xAt(i, series.length).toFixed(1)} ${geo.yAt(s.value).toFixed(1)}`)
    .join(" ");

  const firstX = geo.xAt(0, series.length);
  const lastX = geo.xAt(series.length - 1, series.length);
  const baseY = geo.h - geo.pad.b;
  const areaPath = `${linePath} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;
  const bandHeight = Math.max(geo.bandBottom - geo.bandTop, 1);

  const last = series[series.length - 1]!;

  return (
    <div className="guide-payout-terminal">
      <div className="guide-payout-terminal-toolbar">
        <span className="guide-payout-terminal-toolbar-title">{t("guide.payouts.chartHeader")}</span>
        <span className="guide-payout-terminal-badge">{t("guide.payouts.exampleLabel")}</span>
      </div>

      <div className="guide-payout-terminal-chart-wrap guide-payout-focus-chart">
        <div className="guide-payout-terminal-yaxis" aria-hidden>
          {geo.yTicks
            .slice()
            .reverse()
            .map(({ v, pct }) => (
              <span key={v} className="guide-payout-terminal-ytick" style={{ top: `${pct}%` }}>
                {formatAxisUsdt(v)}
              </span>
            ))}
        </div>

        <div className="guide-payout-terminal-plot">
          <svg viewBox={`0 0 ${geo.w} ${geo.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={t("guide.payouts.chartAria")}>
            <title>{t("guide.payouts.chartTitle")}</title>
            <defs>
              <linearGradient id="guide-payout-terminal-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#B7F500" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#B7F500" stopOpacity="0" />
              </linearGradient>
            </defs>

            {geo.yTicks.map(({ y }, gi) => (
              <line
                key={gi}
                x1={geo.pad.l}
                x2={geo.w - geo.pad.r}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={1}
              />
            ))}

            <rect
              className="guide-payout-range-band"
              x={geo.pad.l}
              y={geo.bandTop}
              width={geo.innerW}
              height={bandHeight}
              fill="rgba(183,245,0,0.06)"
              stroke="rgba(183,245,0,0.18)"
              strokeWidth={1}
              strokeDasharray="3 3"
              rx={2}
            />

            <path d={areaPath} fill="url(#guide-payout-terminal-area)" className="guide-payout-chart-area" />
            <path
              d={linePath}
              fill="none"
              stroke="#B7F500"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="guide-payout-chart-line"
            />

            {series.map((s, i) => {
              const cx = geo.xAt(i, series.length);
              const cy = geo.yAt(s.value);
              const isLast = i === series.length - 1;
              return (
                <g key={s.xLabel} className={isLast ? "guide-payout-point-last" : undefined}>
                  {isLast ? (
                    <line
                      x1={geo.pad.l}
                      x2={cx}
                      y1={cy}
                      y2={cy}
                      stroke="rgba(183,245,0,0.35)"
                      strokeWidth={1}
                      strokeDasharray="2 3"
                    />
                  ) : null}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isLast ? 4.5 : 3.5}
                    fill="#0a0a0a"
                    stroke={isLast ? "#B7F500" : "#71717a"}
                    strokeWidth={isLast ? 2 : 1.5}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div
          className="guide-payout-terminal-xaxis"
          style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}
        >
          {series.map((s) => (
            <span key={s.xLabel} className="text-center">
              {s.xLabel}
            </span>
          ))}
        </div>
      </div>

      <div className="guide-payout-terminal-footer">
        <span>{t("guide.payouts.table.unit")}</span>
        <span>
          {last.xLabel} · <span className="text-[#c4f570]">{last.statusLabel}</span>
        </span>
      </div>

      <table className="guide-payout-terminal-table guide-payout-focus-table">
        <thead>
          <tr>
            <th>{t("guide.payouts.table.period")}</th>
            <th>{t("guide.payouts.table.amount")}</th>
            <th>{t("guide.payouts.table.status")}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((row) => {
            const isAccrued = row.status === "accrued";
            return (
              <tr key={row.xLabel} className={isAccrued ? "is-accrued-row guide-payout-row-accrued" : undefined}>
                <td className="period">{row.xLabel}</td>
                <td className="amount guide-payout-row-value">{row.amountLabel}</td>
                <td>
                  <span className={`guide-payout-terminal-status ${isAccrued ? "is-accrued" : "is-paid"}`}>
                    {row.statusLabel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function buildPayoutTerminalSeries(t: (key: string) => string): ChartPoint[] {
  return GUIDE_PAYOUT_SERIES.map((row) => ({
    xLabel: t(row.monthKey),
    value: row.amountUsdt,
    amountLabel: t(row.amountKey),
    status: row.status,
    statusLabel: t(`guide.payouts.status.${row.status}`),
  }));
}
