"use client";

import type { PositionPreviewItem } from "@/components/dashboard/assets/assets-mock-data";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

import {
  ROUTES,
  assetsSellUnitsPath,
  catalogMarketOverviewReleaseAnalyticsPath,
  catalogMarketOverviewReleaseTablePath,
} from "@/constants/routes";
import { useI18n } from "@/components/providers/i18n-provider";

const statusClass: Record<PositionPreviewItem["status"], string> = {
  Active: "border-blue-100 bg-blue-50 text-blue-800",
  "Open round": "border-neutral-200 bg-white text-neutral-800",
  Secondary: "border-neutral-200 bg-neutral-50 text-neutral-800",
  Closed: "border-neutral-200 bg-neutral-100 text-neutral-600",
};

function positionStatusLabel(
  status: PositionPreviewItem["status"],
  t: (key: string) => string,
): string {
  switch (status) {
    case "Active":
      return t("positions.status.active");
    case "Open round":
      return t("positions.status.openRound");
    case "Secondary":
      return t("positions.status.secondary");
    case "Closed":
      return t("positions.status.closed");
    default:
      return status;
  }
}

function toNumber(raw: string) {
  return Number(raw.replace(/[^\d.-]/g, ""));
}

function buildTrend(row: PositionPreviewItem) {
  const base = toNumber(row.value);
  const share = toNumber(row.share);
  const units = toNumber(row.units);
  const variance = Math.max(18, Math.round(share * 1.6));
  const drift = row.status === "Active" ? 1 : row.status === "Open round" ? 2 : row.status === "Secondary" ? 0 : -1;
  const seed = (units + share * 37) % 17;
  return Array.from({ length: 10 }, (_, i) => base - variance * (9 - i) * 0.35 + drift * i * 4 + ((seed + i * 3) % 7) * 3);
}

function formatCompact(value: number) {
  return `${Math.round(value).toLocaleString(undefined)} USDT`;
}

function Sparkline({
  points,
  gradientId,
  filterId,
  startLabel,
  sparklineAria,
}: {
  points: number[];
  gradientId: string;
  filterId: string;
  startLabel: string;
  sparklineAria: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 280;
  const height = 96;
  const step = width / (points.length - 1);
  const coords = points.map((point, i) => {
    const x = i * step;
    const y = height - ((point - min) / range) * (height - 20) - 10;
    return { x, y, raw: point };
  });
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `${line} ${width},${height} 0,${height}`;
  const active = hoverIndex == null ? coords[coords.length - 1] : coords[hoverIndex];
  const yTicks = [max, max - range / 2, min];
  const xLabels = [startLabel, "· · ·", "Сегодня"];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Оценка · 10 точек</p>
        <p className="font-mono text-[11px] font-semibold tabular-nums text-neutral-900">{formatCompact(active.raw)}</p>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-neutral-50/90 ring-1 ring-neutral-100">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-[88px] w-full cursor-crosshair"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * width;
            const idx = Math.max(0, Math.min(points.length - 1, Math.round(x / step)));
            setHoverIndex(idx);
          }}
          aria-label={sparklineAria}
          role="img"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id={filterId} x="-8%" y="-8%" width="116%" height="116%">
              <feGaussianBlur stdDeviation="0.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0.33, 0.66].map((t) => (
            <line
              key={t}
              x1="0"
              y1={10 + (height - 20) * t}
              x2={width}
              y2={10 + (height - 20) * t}
              stroke="#e5e7eb"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <polygon points={area} fill={`url(#${gradientId})`} />
          <polyline
            points={line}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${filterId})`}
          />

          <line x1={active.x} y1="4" x2={active.x} y2={height - 4} stroke="#93c5fd" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={active.x} cy={active.y} r="4" fill="white" stroke="#1d4ed8" strokeWidth="2" />
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-neutral-500">
        {xLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] text-neutral-400">
        {yTicks.map((tick) => (
          <span key={tick} className="tabular-nums">
            {Math.round(tick).toLocaleString(undefined)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TopPositionCardsGrid({ rows }: { rows: PositionPreviewItem[] }) {
  const { t } = useI18n();
  const uid = useId().replace(/:/g, "");

  const topRows = useMemo(() => rows.slice(0, 4), [rows]);

  return (
    <section className="space-y-5 rounded-3xl bg-white px-5 py-6 sm:space-y-6 sm:px-7 sm:py-8" aria-label="Крупнейшие позиции">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Positions · Top</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Крупнейшие позиции</h2>
          <p className="text-sm text-neutral-500">Детализация и мини-динамика по топ-4 в текущей сортировке</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-neutral-400">Топ-4</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {topRows.map((row, idx) => (
          <article
            key={row.id}
            className="flex flex-col rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 ring-1 ring-neutral-100"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-600 ring-1 ring-neutral-100">
                  {row.release.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{row.release}</p>
                  <p className="truncate text-xs text-neutral-500">{row.artist}</p>
                </div>
              </div>
              <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass[row.status]}`}>
                {positionStatusLabel(row.status, t)}
              </span>
            </div>

            <div className="mt-4 min-h-0 flex-1 rounded-xl bg-white p-3 ring-1 ring-neutral-100">
              <Sparkline
                points={buildTrend(row)}
                gradientId={`pos-mini-${uid}-${row.id}-g`}
                filterId={`pos-mini-${uid}-${row.id}-f`}
                startLabel={row.dateEntered}
                sparklineAria={t("positions.sparklineAria")}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white px-2.5 py-2 ring-1 ring-neutral-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">UNT</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-neutral-900">{row.units}</p>
              </div>
              <div className="rounded-xl bg-white px-2.5 py-2 ring-1 ring-neutral-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Доля</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-neutral-900">{row.share}</p>
              </div>
              <div className="col-span-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-neutral-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Оценка</p>
                <p className="mt-0.5 font-mono text-base font-semibold tabular-nums tracking-tight text-neutral-900">{row.value}</p>
                <p className="text-[11px] text-neutral-500">
                  {row.genre} • #{idx + 1} по сортировке
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {row.catalogReleaseId ? (
                <>
                  <div className="flex gap-2">
                    <Link
                      href={catalogMarketOverviewReleaseAnalyticsPath(row.catalogReleaseId)}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-100 transition hover:bg-neutral-50"
                    >
                      Аналитика
                    </Link>
                    <Link
                      href={catalogMarketOverviewReleaseTablePath(row.catalogReleaseId)}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-100 transition hover:bg-neutral-50"
                    >
                      Рынок
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={assetsSellUnitsPath(row.catalogReleaseId)}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-neutral-900 px-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
                    >
                      Продать
                    </Link>
                    <a
                      href={`#position-${row.id}`}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50/90 px-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100"
                    >
                      К строке
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href={ROUTES.dashboardCatalog}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-neutral-900 px-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Каталог
                  </Link>
                  <Link
                    href={ROUTES.catalogReleaseParameters}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-100 transition hover:bg-neutral-50"
                  >
                    Параметры
                  </Link>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
