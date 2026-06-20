"use client";

import "./catalog-megamenu-preview.css";

import type { LucideIcon } from "@/lib/lucide";
import { ClipboardList, History, Layers, LayoutGrid, Search, ShieldAlert, SlidersHorizontal } from "@/lib/lucide";

import {
  GUIDE_IN_PAGE_NAV,
  GUIDE_TOPIC_CARDS,
  type GuideTopicIconId,
} from "@/constants/guide/selection";
import { BlockCursor, PreviewCover } from "@/components/dashboard/megamenu-preview-blocks";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  RELEASE_PARAMETERS_EXAMPLE,
  RELEASE_PARAMETERS_IN_PAGE_NAV,
} from "@/constants/release-parameters/page";
import { cn } from "@/lib/utils";

const RP_NAV_LABEL_KEYS: Record<string, string> = {
  "rp-top": "catalog.releaseParameters.nav.top",
  "rp-card": "catalog.releaseParameters.nav.card",
  "rp-params": "catalog.releaseParameters.nav.params",
  "rp-first": "catalog.releaseParameters.nav.first",
  "rp-example": "catalog.releaseParameters.nav.example",
  "rp-faq": "catalog.releaseParameters.nav.faq",
};

const RP_SUMMARY_KEYS = ["units", "investorShare", "raiseTarget", "payoutModel"] as const;

function CatalogCursor({ step, hint, className }: { step: string; hint: string; className?: string }) {
  return <BlockCursor step={step} hint={hint} className={className} />;
}

const GUIDE_TOPIC_ICONS: Record<GuideTopicIconId, LucideIcon> = {
  checklist: ClipboardList,
  release: LayoutGrid,
  factors: SlidersHorizontal,
  deal: Layers,
  payouts: History,
  risks: ShieldAlert,
};

function MiniGuideTopicCard({
  icon,
  title,
  description,
  highlight,
  cursorStep,
  cursorHint,
}: {
  icon: GuideTopicIconId;
  title: string;
  description: string;
  highlight?: boolean;
  cursorStep?: string;
  cursorHint?: string;
}) {
  const Icon = GUIDE_TOPIC_ICONS[icon];

  return (
    <article
      className={cn(
        "relative overflow-visible rounded-lg bg-[#121212] p-0.5 ring-1 ring-white/[0.08]",
        highlight && "preview-cat-guide-topic preview-megamenu-target",
      )}
    >
      <div className="flex items-center justify-center rounded-md bg-[#0a0a0a] py-1">
        <Icon className="size-2.5 text-white" strokeWidth={1.35} aria-hidden />
      </div>
      <p className="mt-0.5 line-clamp-1 text-[3.5px] font-semibold leading-snug text-white">{title}</p>
      <p className="mt-px line-clamp-2 text-[2.8px] leading-snug text-zinc-500">{description}</p>
      {highlight && cursorStep && cursorHint ? (
        <CatalogCursor step={cursorStep} hint={cursorHint} className="absolute left-[48%] top-[30%]" />
      ) : null}
    </article>
  );
}

function MiniSparkline({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points
    .map((value, index) => {
      const x = 4 + (index / (points.length - 1)) * 36;
      const y = 14 - ((value - min) / range) * 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 44 16" className={cn("block", className)} aria-hidden>
      <polyline points={coords} fill="none" stroke="#B7F500" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniAnalyticsYieldChart() {
  const { t } = useI18n();

  return (
    <div className="preview-cat-yield-chart relative mt-1 overflow-visible rounded-lg bg-[#0c0c0c] p-1 ring-1 ring-white/[0.08]">
      <svg viewBox="0 0 120 40" className="block h-10 w-full" aria-hidden>
        {[10, 20, 30].map((y) => (
          <line key={y} x1="4" x2="116" y1={y} y2={y} stroke="#27272a" strokeWidth="0.5" strokeDasharray="2 3" />
        ))}
        <path
          d="M4,32 L22,28 L40,26 L58,22 L76,18 L94,14 L112,12"
          fill="none"
          stroke="#B7F500"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M4,32 L22,28 L40,26 L58,22 L76,18 L94,14 L112,12 L112,38 L4,38 Z" fill="url(#catAnalyticsYieldFill)" />
        <defs>
          <linearGradient id="catAnalyticsYieldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B7F500" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          className="preview-cat-yield-crosshair"
          x1="76"
          x2="76"
          y1="8"
          y2="38"
          stroke="#B7F500"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          opacity="0.45"
        />
        <circle className="preview-cat-yield-dot" cx="76" cy="18" r="2.2" fill="#0c0c0c" stroke="#B7F500" strokeWidth="1.2" />
      </svg>
      <div className="preview-cat-yield-tooltip pointer-events-none absolute left-[54%] top-[8%] z-10 rounded-md bg-zinc-900/95 px-1 py-0.5 text-[3.5px] shadow-sm ring-1 ring-white/10">
        <p className="font-semibold text-white">May</p>
        <p className="text-zinc-400">
          {t("preview.megamenu.catalog.colYield")}{" "}
          <span className="font-mono text-[#B7F500]">7,8%</span>
        </p>
      </div>
      <CatalogCursor
        step="cat-analytics-chart"
        hint={t("preview.megamenu.catalog.cursorAnalyticsChart")}
        className="absolute left-[58%] top-[38%]"
      />
    </div>
  );
}

function MiniKpiSparkline({ tone = "neon" }: { tone?: "neon" | "muted" }) {
  const stroke = tone === "neon" ? "#B7F500" : "#71717a";
  return (
    <svg viewBox="0 0 40 12" className="block h-full w-full" aria-hidden>
      <path
        d="M1,10 L8,8 L15,9 L22,5 L29,6 L36,3"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CatalogMainScene() {
  const { t } = useI18n();
  const kpis = [
    { label: t("catalog.hero.stats.releases"), value: "128" },
    { label: t("catalog.hero.stats.volume"), value: "$842K", caption: "7д $2,1M", highlight: true },
  ];
  const row = {
    symbol: "NEON",
    title: "Neon Pulse",
    artist: "Astra Lane",
    price: "12,40 USDT",
    change: "+2,1%",
    up: true,
  };

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-black p-1">
      <div className="shrink-0">
        <p className="text-[7px] font-semibold leading-none text-white">{t("catalog.markets.title")}</p>
        <div className="mt-1 flex gap-2 border-b border-white/[0.08] pb-1" aria-hidden>
          <span className="preview-cat-main-tab--active border-b border-white pb-0.5 text-[4.5px] font-semibold text-white">
            {t("catalog.markets.tabCatalog")}
          </span>
          <span className="border-b border-transparent pb-0.5 text-[4.5px] font-medium text-zinc-500">
            {t("catalog.markets.tabOverview")}
          </span>
        </div>
      </div>

      <div className="relative shrink-0 overflow-visible rounded-lg bg-[#0c0c0c] px-1 py-1 ring-1 ring-white/[0.08]">
        <p className="text-[3px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{t("catalog.filters.title")}</p>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-1 top-1/2 size-1.5 -translate-y-1/2 text-zinc-500" aria-hidden />
          <div className="h-3.5 rounded-md bg-white/[0.05] pl-3.5 text-[3.5px] leading-[14px] text-zinc-500">
            {t("catalog.search.placeholder")}
          </div>
        </div>
        <div className="relative mt-1 overflow-visible">
          <div className="flex flex-wrap gap-0.5">
            <span className="rounded-md bg-white px-1 py-0.5 text-[3.5px] font-semibold text-black">{t("catalog.filters.kind.all")}</span>
            <span className="preview-cat-main-kind-target preview-megamenu-target rounded-md bg-white/[0.06] px-1 py-0.5 text-[3.5px] font-semibold text-zinc-300">
              {t("catalog.filters.kind.funding")}
            </span>
          </div>
          <CatalogCursor
            step="cat-main-filter"
            hint={t("preview.megamenu.catalog.cursorFilter")}
            className="absolute left-[42%] top-[62%]"
          />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-1">
        {kpis.map((item) => (
          <article
            key={item.label}
            className={cn(
              "rounded-lg bg-[#141414] px-1 py-1 ring-1 ring-white/[0.08]",
              item.highlight && "preview-cat-main-kpi",
            )}
          >
            <p className="line-clamp-2 text-[3px] leading-tight text-zinc-500">{item.label}</p>
            <p className="mt-0.5 font-mono text-[6.5px] font-semibold tabular-nums leading-none text-white">{item.value}</p>
            <div className="mt-1 h-3">
              <MiniKpiSparkline tone={item.highlight ? "neon" : "muted"} />
            </div>
            {item.caption ? <p className="mt-0.5 text-[3px] text-[#B7F500]/90">{item.caption}</p> : null}
          </article>
        ))}
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible">
        <div className="relative overflow-visible rounded-lg bg-[#0c0c0c] ring-1 ring-white/[0.08]">
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-1 border-b border-white/[0.08] px-1 py-1 text-[3.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            <span>{t("catalog.markets.colName")}</span>
            <span className="text-right">{t("catalog.markets.colPrice")}</span>
          </div>
          <div className="relative overflow-visible">
            <div className="preview-cat-main-row preview-megamenu-target relative flex items-center gap-1 border-t border-white/[0.05] px-1 py-1.5">
              <span className="size-3 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-violet-950" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[5px] font-semibold leading-none text-white">{row.symbol}</p>
                <p className="mt-0.5 truncate text-[4px] text-zinc-500">
                  {row.title} · {row.artist}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[4.5px] font-semibold tabular-nums leading-none text-white">{row.price}</p>
                <p className="mt-0.5 font-mono text-[4px] tabular-nums text-[#B7F500]">{row.change}</p>
              </div>
            </div>
            <CatalogCursor
              step="cat-main-row"
              hint={t("preview.megamenu.catalog.cursorReleaseRow")}
              className="absolute left-[10%] top-[42%]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export function CatalogAnalyticsScene() {
  const { t } = useI18n();
  const periods = ["7D", "30D", "90D"] as const;
  const kpis = [
    { label: t("preview.megamenu.catalog.kpiTotal"), value: "128" },
    { label: t("preview.megamenu.catalog.kpiAvgYield"), value: "6,4%", highlight: true },
  ];
  const row = {
    name: "Neon Pulse",
    artist: "Astra Lane",
    yield: "8,4%",
    delta: "+1,2%",
    spark: [3, 4, 3.5, 5, 4.8, 6],
    status: t("preview.megamenu.catalog.statusActive"),
  };

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-black p-1">
      <div className="flex shrink-0 items-end justify-between gap-1">
        <h1 className="text-[7px] font-semibold leading-none tracking-tight text-white">
          {t("nav.catalog.analytics.releases.label")}
        </h1>
        <div className="flex items-center gap-0.5">
          <span className="font-mono text-[2.8px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {t("preview.megamenu.catalog.analyticsPeriod")}
          </span>
          <div className="flex gap-0.5">
            {periods.map((period, index) => (
              <span
                key={period}
                className={cn(
                  "rounded px-1 py-0.5 font-mono text-[3.5px] font-semibold",
                  index === 1
                    ? "preview-cat-analytics-period--active bg-white text-black"
                    : "bg-white/[0.06] text-zinc-400",
                )}
              >
                {period}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-1">
        {kpis.map((item) => (
          <article
            key={item.label}
            className={cn(
              "relative overflow-hidden rounded-lg bg-[#141414] px-1 py-1 ring-1 ring-white/[0.08]",
              item.highlight && "preview-cat-analytics-kpi",
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" aria-hidden />
            <p className="relative line-clamp-2 text-[3px] leading-tight text-zinc-500">{item.label}</p>
            <p className="relative mt-0.5 font-mono text-[6.5px] font-semibold tabular-nums leading-none text-white">
              {item.value}
            </p>
          </article>
        ))}
      </div>

      <section className="relative shrink-0 overflow-visible">
        <div className="flex items-center justify-between gap-1">
          <p className="font-mono text-[4.5px] font-semibold text-white">{t("preview.megamenu.catalog.yieldChartTitle")}</p>
          <span className="font-mono text-[3px] font-semibold uppercase tracking-wide text-zinc-500">30D</span>
        </div>
        <MiniAnalyticsYieldChart />
      </section>

      <div className="shrink-0 space-y-1">
        <div className="flex gap-2 border-b border-white/[0.08] pb-1" aria-hidden>
          <span className="preview-cat-analytics-tab--active border-b border-white pb-0.5 text-[4px] font-semibold text-white">
            {t("preview.megamenu.catalog.analyticsTabAll")}
          </span>
          <span className="border-b border-transparent pb-0.5 text-[4px] font-medium text-zinc-500">
            {t("preview.megamenu.catalog.analyticsTabActive")}
          </span>
        </div>
        <div className="relative overflow-visible">
          <div className="flex flex-wrap items-center gap-0.5">
            <span className="rounded-md bg-white/[0.08] px-1 py-0.5 text-[3.5px] font-medium text-zinc-400">
              {t("marketOverview.tab.all")}
            </span>
            <span className="preview-cat-analytics-chip preview-megamenu-target rounded-md bg-white px-1 py-0.5 text-[3.5px] font-semibold text-black">
              {t("preview.megamenu.catalog.analyticsChipTop")}
            </span>
          </div>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-0 top-1/2 size-1.5 -translate-y-1/2 text-zinc-600" aria-hidden />
            <div className="border-b border-white/10 py-0.5 pl-2.5 font-mono text-[3.5px] text-zinc-600">
              {t("analytics.releases.searchPlaceholder")}
            </div>
          </div>
        </div>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible">
        <div className="relative overflow-visible rounded-lg bg-[#111111] ring-1 ring-white/[0.06]">
          <div className="grid grid-cols-[1.1fr_0.5fr_0.35fr_0.55fr_0.55fr] gap-0.5 border-b border-white/[0.06] px-1 py-1 font-mono text-[3px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
            <span>{t("analytics.releases.table.name")}</span>
            <span>{t("analytics.releases.table.yield")}</span>
            <span>Δ</span>
            <span>{t("analytics.releases.table.dynamics")}</span>
            <span>{t("analytics.releases.table.status")}</span>
          </div>
          <div className="relative overflow-visible">
            <div className="preview-cat-analytics-row preview-megamenu-target grid grid-cols-[1.1fr_0.5fr_0.35fr_0.55fr_0.55fr] items-center gap-0.5 border-t border-white/[0.05] px-1 py-1.5 text-[4px] text-zinc-300">
              <div className="min-w-0">
                <p className="truncate text-[4.5px] font-semibold text-white">{row.name}</p>
                <p className="truncate text-[3.5px] text-zinc-500">{row.artist}</p>
              </div>
              <span className="font-mono text-[4px] font-semibold tabular-nums text-[#B7F500]">{row.yield}</span>
              <span className="font-mono text-[3.5px] tabular-nums text-[#B7F500]">{row.delta}</span>
              <MiniSparkline points={row.spark} className="w-[18px]" />
              <span className="text-[3.5px] text-zinc-400">{row.status}</span>
            </div>
            <CatalogCursor
              step="cat-analytics-row"
              hint={t("preview.megamenu.catalog.cursorRelease")}
              className="absolute left-[8%] top-[42%]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export function CatalogGuideScene() {
  const { t } = useI18n();
  const topicCards = GUIDE_TOPIC_CARDS.slice(0, 4);
  const navItems = GUIDE_IN_PAGE_NAV.slice(0, 8);
  const activeNavId = "topics";
  const targetNavId = "risks";

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,0.38fr)] gap-1 overflow-visible bg-black p-1">
      <div className="flex min-h-0 flex-col gap-1 overflow-visible">
        <div className="relative shrink-0 overflow-visible rounded-lg ring-1 ring-white/10">
          <div className="relative h-12 overflow-hidden rounded-lg">
            <PreviewCover
              src="/images/catalogbuy/2-128.webp"
              className="absolute inset-0"
              imageClassName="object-[center_35%]"
              overlayClassName="bg-gradient-to-b from-black/35 via-black/55 to-black/75"
            />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-1 py-0.5 text-center">
              <p className="line-clamp-2 text-[5px] font-semibold leading-tight tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
                {t("guide.hero.title")}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[3px] leading-snug text-zinc-300/90">{t("guide.hero.subtitle")}</p>
              <div className="relative mt-0.5 flex flex-wrap justify-center gap-0.5 overflow-visible">
                <span className="relative inline-flex overflow-visible">
                  <span className="preview-cat-guide-cta preview-megamenu-target rounded-full bg-[#B7F500] px-1 py-0.5 text-[3px] font-semibold text-black">
                    {t("guide.hero.cta.catalog")}
                  </span>
                  <CatalogCursor
                    step="cat-guide-cta"
                    hint={t("preview.megamenu.catalog.cursorGuideCta")}
                    className="absolute left-[52%] top-[72%]"
                  />
                </span>
                <span className="rounded-full bg-white/10 px-1 py-0.5 text-[3px] font-semibold text-white">
                  {t("guide.hero.cta.compare")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="relative min-h-0 flex-1 overflow-visible">
          <p className="mb-0.5 text-center text-[4px] font-semibold text-white">{t("guide.topics.title")}</p>
          <div className="grid grid-cols-2 gap-0.5 overflow-visible">
            {topicCards.map((card, index) => (
              <MiniGuideTopicCard
                key={card.anchor}
                icon={card.icon}
                title={t(card.titleKey)}
                description={t(card.descKey)}
                highlight={index === 0}
                cursorStep={index === 0 ? "cat-guide-topic" : undefined}
                cursorHint={index === 0 ? t("preview.megamenu.catalog.cursorGuideTopic") : undefined}
              />
            ))}
          </div>
        </section>
      </div>

      <aside className="relative flex min-h-0 flex-col overflow-visible rounded-lg bg-[#0a0a0a]/90 p-0.5 ring-1 ring-white/[0.06]">
        <p className="mb-0.5 px-0.5 text-[2.8px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          {t("guide.nav.title")}
        </p>
        <ol className="relative min-h-0 flex-1 space-y-px overflow-visible border-l border-white/10 pl-1">
          {navItems.map((item, idx) => {
            const isActive = item.id === activeNavId;
            const isTarget = item.id === targetNavId;

            return (
              <li
                key={item.id}
                className={cn(
                  "relative overflow-visible",
                  isTarget && "preview-cat-guide-nav preview-megamenu-target",
                )}
              >
                <div
                  className={cn(
                    "flex gap-0.5 rounded-r border-l-2 py-0.5 pl-0.5 pr-0.5 text-[3px] leading-snug",
                    isActive && "border-[#B7F500]/75 bg-[#B7F500]/6 font-medium text-white",
                    !isActive && "border-transparent text-zinc-500",
                  )}
                >
                  <span
                    className={cn(
                      "w-2.5 shrink-0 font-mono text-[2.8px] tabular-nums",
                      isActive ? "text-[#c4f570]" : "text-zinc-600",
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <span className="line-clamp-1">{t(item.labelKey)}</span>
                </div>
                {isTarget ? (
                  <CatalogCursor
                    step="cat-guide-nav"
                    hint={t("preview.megamenu.catalog.cursorGuideNav")}
                    className="absolute left-[38%] top-[52%]"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

export function CatalogReleaseParamsScene() {
  const { t } = useI18n();
  const ex = RELEASE_PARAMETERS_EXAMPLE;
  const exampleRows = [
    { k: t("catalog.releaseParameters.example.row.status"), v: t("catalog.releaseParameters.example.status") },
    { k: t("catalog.releaseParameters.example.row.totalUnits"), v: ex.totalUnits },
    { k: t("catalog.releaseParameters.example.row.investorShare"), v: ex.investorShare },
  ];
  const activeNavId = "rp-top";
  const targetNavId = "rp-example";

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,0.36fr)] gap-1 overflow-visible bg-black p-1">
      <div className="flex min-h-0 flex-col gap-1 overflow-visible">
        <div className="relative shrink-0 overflow-visible rounded-lg ring-1 ring-white/10">
          <div className="relative h-11 overflow-hidden rounded-lg">
            <PreviewCover
              src="/images/catalogbuy/2-128.webp"
              className="absolute inset-0"
              imageClassName="object-[center_35%]"
              overlayClassName="bg-gradient-to-b from-black/35 via-black/55 to-black/75"
            />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-1 py-0.5 text-center">
              <p className="line-clamp-2 text-[5px] font-semibold leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
                {t("catalog.releaseParameters.hero.title")}
              </p>
              <div className="relative mt-0.5 flex flex-wrap justify-center gap-0.5 overflow-visible">
                <span className="rounded-full bg-[#B7F500] px-1 py-0.5 text-[3px] font-semibold text-black">
                  {t("catalog.releaseParameters.hero.ctaCatalog")}
                </span>
                <span className="rounded-full bg-white/10 px-1 py-0.5 text-[3px] font-semibold text-white">
                  {t("catalog.releaseParameters.hero.ctaGuide")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="shrink-0 overflow-visible rounded-lg bg-[#111111] px-1 py-1 ring-1 ring-white/[0.08]">
          <p className="text-center font-mono text-[2.8px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {t("catalog.releaseParameters.hero.summaryLabel")}
          </p>
          <div className="mt-0.5 grid grid-cols-2 gap-0.5">
            {RP_SUMMARY_KEYS.map((slug, index) => (
              <article
                key={slug}
                className={cn(
                  "relative overflow-visible rounded-md bg-[#0a0a0a]/80 p-0.5",
                  index === 0 && "preview-cat-params-summary preview-megamenu-target",
                )}
              >
                <div className="flex items-center gap-0.5">
                  <span className="flex size-2.5 shrink-0 items-center justify-center rounded-full border border-[#B7F500]/35 bg-[#B7F500]/10 font-mono text-[2.5px] font-semibold text-[#c4f570]">
                    {index + 1}
                  </span>
                  <p className="font-mono text-[2.5px] font-semibold uppercase tracking-wide text-zinc-500">
                    {t(`catalog.releaseParameters.hero.summary.${slug}.label`)}
                  </p>
                </div>
                <p className="mt-0.5 text-[3.5px] font-semibold text-white">
                  {t(`catalog.releaseParameters.hero.summary.${slug}.value`)}
                </p>
                {index === 0 ? (
                  <CatalogCursor
                    step="cat-params-units"
                    hint={t("preview.megamenu.catalog.cursorParams")}
                    className="absolute left-[48%] top-[58%]"
                  />
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-[#0c0c0e] ring-1 ring-white/[0.06]">
          <div className="px-1 py-0.5">
            <p className="font-mono text-[2.8px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {t("catalog.releaseParameters.example.cardKicker")}
            </p>
            <p className="mt-0.5 text-[4.5px] font-semibold text-white">{t("catalog.releaseParameters.example.headline")}</p>
          </div>
          <div className="relative overflow-visible border-t border-white/5">
            {exampleRows.map((row, index) => (
              <div
                key={row.k}
                className={cn(
                  "relative flex items-center justify-between gap-0.5 border-t border-white/4 px-1 py-0.5",
                  index === 0 && "preview-cat-params-example preview-megamenu-target",
                )}
              >
                <span className="text-[3px] uppercase tracking-wide text-zinc-500">{row.k}</span>
                <span className="font-mono text-[3.5px] font-semibold tabular-nums text-zinc-100">{row.v}</span>
                {index === 0 ? (
                  <CatalogCursor
                    step="cat-params-example"
                    hint={t("preview.megamenu.catalog.cursorParamsExample")}
                    className="absolute left-[42%] top-[52%]"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="relative flex min-h-0 flex-col overflow-visible rounded-lg bg-[#0a0a0a]/90 p-0.5 ring-1 ring-white/[0.06]">
        <p className="mb-0.5 px-0.5 font-mono text-[2.5px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          {t("catalog.releaseParameters.nav.kicker")}
        </p>
        <ol className="relative min-h-0 flex-1 space-y-px overflow-visible border-l border-white/10 pl-1">
          {RELEASE_PARAMETERS_IN_PAGE_NAV.map((item, idx) => {
            const isActive = item.id === activeNavId;
            const isTarget = item.id === targetNavId;
            const labelKey = RP_NAV_LABEL_KEYS[item.id];

            return (
              <li
                key={item.id}
                className={cn("relative overflow-visible", isTarget && "preview-cat-params-nav preview-megamenu-target")}
              >
                <div
                  className={cn(
                    "flex gap-0.5 rounded-r border-l-2 py-0.5 pl-0.5 pr-0.5 text-[3px] leading-snug",
                    isActive && "border-[#B7F500]/75 bg-[#B7F500]/6 font-medium text-white",
                    !isActive && "border-transparent text-zinc-500",
                  )}
                >
                  <span
                    className={cn(
                      "w-2.5 shrink-0 font-mono text-[2.8px] tabular-nums",
                      isActive ? "text-[#c4f570]" : "text-zinc-600",
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <span className="line-clamp-1">{labelKey ? t(labelKey) : item.label}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

export function CatalogMarketScene() {
  const { t } = useI18n();
  const periods = ["24h", "7d", "30d"] as const;
  const tabs = ["all", "yield", "demand"] as const;
  const kpis = [
    { label: t("marketOverview.kpi.volume24h"), value: "$842K" },
    { label: t("marketOverview.kpi.trades24h"), value: "1 284" },
    { label: t("marketOverview.kpi.activeListings"), value: "96" },
  ];
  const row = {
    symbol: "NEON",
    title: "Neon Pulse",
    artist: "Astra Lane",
    price: "$12,40",
    change: "+2,1%",
    up: true,
  };

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-black p-1">
      <div className="flex shrink-0 items-end justify-between gap-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-0.5">
            <span className="font-mono text-[2.8px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {t("marketOverview.header.market")}
            </span>
            <span className="rounded bg-[#0a0a0a] px-0.5 py-px text-[2.8px] font-semibold uppercase tracking-wide text-zinc-400">
              {t("marketOverview.header.snapshot")}
            </span>
          </div>
          <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-white">
            {t("marketOverview.header.title")}
          </h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="font-mono text-[2.5px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
            {t("marketOverview.header.period")}
          </span>
          <div className="flex gap-0.5">
            {periods.map((period, index) => (
              <span
                key={period}
                className={cn(
                  "rounded px-1 py-0.5 font-mono text-[3.5px] font-semibold",
                  index === 1
                    ? "preview-cat-market-period bg-white text-black"
                    : "bg-white/[0.06] text-zinc-400",
                )}
              >
                {t(`marketOverview.period.${period}`)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-0.5">
        {kpis.map((item) => (
          <article key={item.label} className="rounded-lg bg-[#141414] px-0.5 py-0.5 ring-1 ring-white/[0.08]">
            <p className="line-clamp-2 text-[2.8px] leading-tight text-zinc-500">{item.label}</p>
            <p className="mt-0.5 font-mono text-[5.5px] font-semibold tabular-nums leading-none text-white">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="shrink-0 space-y-0.5">
        <div className="flex gap-1.5 border-b border-white/[0.08] pb-0.5" aria-hidden>
          {tabs.map((tab, index) => (
            <span
              key={tab}
              className={cn(
                "relative overflow-visible border-b pb-0.5 text-[3.5px] font-semibold",
                index === 0
                  ? "preview-cat-market-tab preview-megamenu-target border-white text-white"
                  : "border-transparent text-zinc-500",
              )}
            >
              {t(`marketOverview.tab.${tab}`)}
              {index === 0 ? (
                <CatalogCursor
                  step="cat-market-segment"
                  hint={t("preview.megamenu.catalog.cursorMarket")}
                  className="absolute left-[40%] top-[72%]"
                />
              ) : null}
            </span>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-0 top-1/2 size-1.5 -translate-y-1/2 text-zinc-600" aria-hidden />
          <div className="rounded-md border border-white/8 bg-white/4 py-0.5 pl-2.5 font-mono text-[3.5px] text-zinc-600">
            {t("marketOverview.toolbar.searchPlaceholder")}
          </div>
        </div>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible">
        <div className="relative overflow-visible rounded-lg bg-[#111111] ring-1 ring-white/[0.06]">
          <div className="grid grid-cols-[1.1fr_0.55fr_0.45fr] gap-0.5 border-b border-white/[0.06] px-1 py-1 font-mono text-[3px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
            <span>{t("catalog.markets.colName")}</span>
            <span className="text-right">{t("catalog.markets.colPrice")}</span>
            <span className="text-right">Δ</span>
          </div>
          <div className="relative overflow-visible">
            <div className="preview-cat-market-row preview-megamenu-target grid grid-cols-[1.1fr_0.55fr_0.45fr] items-center gap-0.5 border-t border-white/[0.05] px-1 py-1.5 text-[4px] text-zinc-300">
              <div className="min-w-0">
                <p className="truncate text-[4.5px] font-semibold text-white">{row.symbol}</p>
                <p className="truncate text-[3.5px] text-zinc-500">
                  {row.title} · {row.artist}
                </p>
              </div>
              <span className="text-right font-mono text-[4px] font-semibold tabular-nums text-white">{row.price}</span>
              <span className="text-right font-mono text-[3.5px] tabular-nums text-[#B7F500]">{row.change}</span>
            </div>
            <CatalogCursor
              step="cat-market-row"
              hint={t("preview.megamenu.catalog.cursorMarketRow")}
              className="absolute left-[10%] top-[48%]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
