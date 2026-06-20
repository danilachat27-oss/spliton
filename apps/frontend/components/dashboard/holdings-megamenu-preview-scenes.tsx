"use client";

import "./holdings-megamenu-preview.css";

import { Search } from "@/lib/lucide";

import { positionPreviews } from "@/components/dashboard/assets/assets-mock-data";
import { activityRecords } from "@/components/dashboard/assets/activity-mock-data";
import { BlockCursor } from "@/components/dashboard/megamenu-preview-blocks";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

function HoldCursor({ step, hint, className }: { step: string; hint: string; className?: string }) {
  return <BlockCursor step={step} hint={hint} className={className} />;
}

function MiniPortfolioChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 36" className={cn("block w-full", className)} aria-hidden>
      {[10, 20, 30].map((y) => (
        <line key={y} x1="4" x2="116" y1={y} y2={y} stroke="#e5e5e5" strokeWidth="0.5" strokeDasharray="2 3" />
      ))}
      <path
        d="M4,28 L22,26 L40,24 L58,20 L76,18 L94,14 L112,12"
        fill="none"
        stroke="#171717"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M4,28 L22,26 L40,24 L58,20 L76,18 L94,14 L112,12 L112,34 L4,34 Z" fill="url(#holdMiniFill)" />
      <defs>
        <linearGradient id="holdMiniFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#171717" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MiniMetricsPnlChart() {
  const { t } = useI18n();

  return (
    <div className="preview-hold-metrics-chart relative mt-1 overflow-visible rounded-lg bg-neutral-50/90 p-1">
      <svg viewBox="0 0 120 40" className="block h-12 w-full" aria-hidden>
        <path
          d="M4,32 L20,28 L36,26 L52,22 L68,24 L84,18 L100,16 L116,14"
          fill="none"
          stroke="#16a34a"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          className="preview-hold-metrics-crosshair"
          x1="84"
          x2="84"
          y1="8"
          y2="36"
          stroke="#86efac"
          strokeWidth="0.6"
          strokeDasharray="2 2"
        />
        <circle className="preview-hold-metrics-dot" cx="84" cy="18" r="2.4" fill="white" stroke="#16a34a" strokeWidth="1.2" />
      </svg>
      <div className="preview-hold-metrics-tooltip pointer-events-none absolute left-[54%] top-[4%] z-10 rounded-md bg-white/95 px-1.5 py-0.5 text-[5px] shadow-sm ring-1 ring-neutral-200/70">
        <p className="font-semibold text-neutral-900">Apr</p>
        <p className="text-neutral-600">
          PnL <span className="font-mono text-emerald-700">+4,2%</span>
        </p>
      </div>
      <HoldCursor step="hold-metrics-chart" hint={t("preview.megamenu.holdings.cursorMetrics")} className="absolute left-[58%] top-[42%]" />
    </div>
  );
}

export function HoldingsOverviewScene() {
  const { t } = useI18n();
  const row = positionPreviews[0]!;

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <section className="shrink-0 overflow-visible rounded-lg bg-white px-1.5 py-1.5 ring-1 ring-neutral-200/60">
        <p className="text-[5px] text-neutral-500">{t("overview.estimatedTotal")}</p>
        <div className="mt-0.5 flex flex-wrap items-end gap-1">
          <p className="font-mono text-[14px] font-semibold leading-none tabular-nums tracking-tight text-neutral-900">6 520</p>
          <span className="mb-0.5 text-[5.5px] font-medium text-neutral-500">USDT</span>
        </div>
        <p className="mt-0.5 text-[5px] tabular-nums text-neutral-500">+2,4% · 30d</p>
        <div className="relative mt-1.5 flex flex-wrap gap-1 overflow-visible">
          <span className="relative inline-flex overflow-visible">
            <span className="preview-hold-deposit-btn preview-megamenu-target rounded-md bg-neutral-900 px-1.5 py-0.5 text-[5px] font-semibold text-white">
              {t("overview.deposit")}
            </span>
            <HoldCursor
              step="hold-overview-deposit"
              hint={t("preview.megamenu.holdings.cursorDeposit")}
              className="absolute left-[50%] top-[78%]"
            />
          </span>
          <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[5px] font-semibold text-neutral-800">
            {t("overview.withdraw")}
          </span>
        </div>
      </section>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[6px] font-semibold text-neutral-900">{t("overview.portfolioSection")}</p>
          <span className="text-[4.5px] font-medium text-neutral-500">{t("positions.preview.allLink")}</span>
        </div>
        <ul className="relative mt-1 overflow-visible">
          <li className="preview-hold-portfolio-row preview-megamenu-target relative flex items-center justify-between gap-1 rounded-md px-0.5 py-1">
            <div className="flex min-w-0 items-center gap-1">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[4px] font-bold uppercase text-neutral-500">
                {row.release.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[5.5px] font-semibold text-neutral-900">{row.release}</p>
                <p className="truncate text-[4.5px] text-neutral-500">
                  {row.artist} · {row.units} UNT
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[5.5px] font-semibold tabular-nums text-neutral-900">{row.value}</p>
              <p className="text-[4px] tabular-nums text-neutral-500">{row.share}</p>
            </div>
            <HoldCursor
              step="hold-overview-portfolio"
              hint={t("preview.megamenu.holdings.cursorPositions")}
              className="absolute left-[12%] top-[58%]"
            />
          </li>
        </ul>
      </section>

      <section className="shrink-0 rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <p className="text-[6px] font-semibold text-neutral-900">{t("metrics.balanceTitle")}</p>
        <MiniPortfolioChart className="mt-1 h-10" />
      </section>
    </div>
  );
}

export function HoldingsMetricsScene() {
  const { t } = useI18n();
  const kpis = [
    { label: t("assets.metrics.statTodayChange"), value: "+$142", hint: "+2,4%" },
    { label: t("assets.metrics.statHoldingsValue"), value: "6 520", hint: "USDT" },
  ];
  const ranges = ["7d", "30d", "90d"] as const;
  const rangeKeys = {
    "7d": "chart.range7d",
    "30d": "chart.range30d",
    "90d": "chart.range90d",
  } as const;

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="grid shrink-0 grid-cols-2 gap-1">
        {kpis.map((item) => (
          <article key={item.label} className="rounded-lg bg-white px-1 py-1 ring-1 ring-neutral-200/60">
            <p className="line-clamp-2 text-[4.5px] leading-tight text-neutral-500">{item.label}</p>
            <p className="mt-0.5 font-mono text-[8px] font-semibold tabular-nums leading-none text-neutral-900">{item.value}</p>
            <p className="text-[4.5px] text-neutral-500">{item.hint}</p>
          </article>
        ))}
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Metrics · PnL</p>
        <p className="mt-0.5 text-[6.5px] font-semibold text-neutral-900">{t("metrics.pnlTitle")}</p>
        <p className="font-mono text-[10px] font-semibold tabular-nums text-emerald-700">+4,2%</p>
        <div className="mt-1 flex gap-0.5 rounded-md bg-neutral-100 p-0.5" aria-hidden>
          <span className="preview-hold-pnl-tab--active rounded px-1.5 py-0.5 text-[4.5px] font-semibold">USDT</span>
          <span className="rounded px-1.5 py-0.5 text-[4.5px] font-semibold text-neutral-500">%</span>
        </div>
        <MiniMetricsPnlChart />
      </section>

      <section className="shrink-0 rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <p className="text-[5.5px] font-semibold text-neutral-900">{t("metrics.balanceTitle")}</p>
        <div className="mt-0.5 flex rounded-md bg-neutral-100 p-0.5" aria-hidden>
          {ranges.map((id) => (
            <span
              key={id}
              className={cn(
                "rounded px-1 py-0.5 text-[4px] font-semibold",
                id === "30d" ? "bg-white text-neutral-900 ring-1 ring-neutral-200/80" : "text-neutral-500",
              )}
            >
              {t(rangeKeys[id])}
            </span>
          ))}
        </div>
        <MiniPortfolioChart className="mt-1 h-8" />
      </section>
    </div>
  );
}

export function HoldingsActivityScene() {
  const { t } = useI18n();
  const tabs = [
    { id: "all", label: t("activity.tab.all"), active: true },
    { id: "deposits", label: t("activity.tab.deposits"), active: false },
    { id: "buys", label: t("activity.tab.buys"), active: false },
  ];
  const row = activityRecords[0]!;

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="flex shrink-0 gap-2 border-b border-neutral-200/80 px-0.5 pb-1" aria-hidden>
        {tabs.map((tab) => (
          <span
            key={tab.id}
            className={cn(
              "relative overflow-visible border-b pb-0.5 text-[5px] font-semibold",
              tab.active
                ? "preview-hold-activity-tab--active border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500",
            )}
          >
            {tab.label}
          </span>
        ))}
      </div>

      <div className="relative shrink-0 overflow-visible">
        <Search className="pointer-events-none absolute left-1 top-1/2 size-2 -translate-y-1/2 text-neutral-400" aria-hidden />
        <div className="h-4 rounded-lg bg-white py-1 pl-3 pr-1 text-[4.5px] leading-[16px] text-neutral-400 ring-1 ring-neutral-200/60">
          {t("activity.searchPlaceholder")}
        </div>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1 py-1 ring-1 ring-neutral-200/60">
        <div className="grid grid-cols-[0.7fr_1fr_0.65fr] gap-1 border-b border-neutral-100 px-0.5 py-1 text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
          <span>{t("activity.widgets.tableDate")}</span>
          <span>{t("activity.widgets.tableType")}</span>
          <span className="text-right">{t("activity.widgets.tableAmount")}</span>
        </div>
        <div className="preview-hold-activity-target preview-megamenu-target relative grid grid-cols-[0.7fr_1fr_0.65fr] items-center gap-1 border-t border-neutral-100 px-0.5 py-1.5 text-[5px]">
          <span className="text-neutral-600">{row.date.split(" ")[0]}</span>
          <span className="font-semibold text-neutral-900">
            {row.typeKey ? t(`activity.widgets.type.${row.typeKey}`) : row.type}
          </span>
          <span className="text-right font-mono font-semibold tabular-nums text-neutral-900">{row.amount}</span>
          <HoldCursor
            step="hold-activity-row"
            hint={t("preview.megamenu.holdings.cursorActivity")}
            className="absolute left-[10%] top-[52%]"
          />
        </div>
      </section>
    </div>
  );
}

export function HoldingsPositionsScene() {
  const { t } = useI18n();
  const tabs = [
    { id: "all", label: t("activity.tab.all"), active: true },
    { id: "active", label: t("positions.widgets.status.active"), active: false },
    { id: "secondary", label: t("positions.widgets.status.secondary"), active: false },
  ];
  const row = positionPreviews[0]!;

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="flex shrink-0 gap-2 border-b border-neutral-200/80 px-0.5 pb-1" aria-hidden>
        {tabs.map((tab) => (
          <span
            key={tab.id}
            className={cn(
              "border-b pb-0.5 text-[5px] font-semibold",
              tab.active
                ? "preview-hold-positions-tab--active border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500",
            )}
          >
            {tab.label}
          </span>
        ))}
      </div>

      <div className="relative shrink-0 overflow-visible">
        <Search className="pointer-events-none absolute left-1 top-1/2 size-2 -translate-y-1/2 text-neutral-400" aria-hidden />
        <div className="h-4 rounded-lg bg-white py-1 pl-3 pr-1 text-[4.5px] leading-[16px] text-neutral-400 ring-1 ring-neutral-200/60">
          {t("positions.searchPlaceholder")}
        </div>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1 py-1 ring-1 ring-neutral-200/60">
        <div className="grid grid-cols-[1.1fr_0.55fr_0.55fr] gap-1 border-b border-neutral-100 px-0.5 py-1 text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
          <span>{t("positions.widgets.tableRelease")}</span>
          <span>{t("positions.widgets.tableUnits")}</span>
          <span className="text-right">{t("positions.widgets.tableValue")}</span>
        </div>
        <div className="preview-hold-positions-target preview-megamenu-target relative grid grid-cols-[1.1fr_0.55fr_0.55fr] items-center gap-1 border-t border-neutral-100 px-0.5 py-1.5 text-[5px]">
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{row.release}</p>
            <p className="truncate text-[4.5px] text-neutral-500">{row.artist}</p>
          </div>
          <span className="font-mono tabular-nums text-neutral-800">{row.units}</span>
          <span className="text-right font-mono font-semibold tabular-nums text-neutral-900">{row.value}</span>
          <HoldCursor
            step="hold-positions-row"
            hint={t("preview.megamenu.holdings.cursorPositions")}
            className="absolute left-[8%] top-[52%]"
          />
        </div>
      </section>
    </div>
  );
}
