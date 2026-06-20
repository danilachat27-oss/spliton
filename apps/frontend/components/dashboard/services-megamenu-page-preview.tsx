"use client";

import "./services-megamenu-preview.css";

import Image from "next/image";
import { BarChart3, Check, FileStack, Layers3, Search } from "@/lib/lucide";
import { useEffect, useState, type ReactNode } from "react";

import { ROUTES } from "@/constants/routes";
import { PUBLIC_STATUS_COMPONENTS } from "@/constants/system-status-components";
import {
  NEWS_CATEGORY_FILTERS,
  newsArticlesMock,
} from "@/constants/news-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { BlockCursor, PageHero, PreviewCover } from "@/components/dashboard/megamenu-preview-blocks";
import { MegamenuPreviewSceneShell } from "@/components/dashboard/megamenu-preview-primitives";
import { formatReadTimeLabel } from "@/lib/news-utils";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

const ISSUER_PREVIEW = {
  portalHero: "/images/issuer/portal-hero.png",
  processBg: "/images/%27vbntn/2.png",
} as const;

const ISSUER_FEATURE_CONFIG = [
  { id: "analytics", icon: BarChart3 },
  { id: "documents", icon: FileStack },
  { id: "management", icon: Layers3 },
] as const;

function PreviewArtistProcessCursor({ step, hint }: { step: 1 | 2 | 3; hint: string }) {
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-20" aria-hidden>
      <div className={cn("preview-artist-process-cursor relative", `preview-artist-process-cursor--${step}`)}>
        <svg width="8" height="9" viewBox="0 0 14 16" className="drop-shadow-md">
          <path
            d="M1 1L1 13.5L4.2 10.3L6.5 15.5L8.2 14.7L5.9 9.5L10.5 9.5L1 1Z"
            fill="white"
            stroke="#111"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={cn(
            "preview-artist-process-ring absolute left-1 top-1 size-1.5 rounded-full border border-[#B7F500]/90",
            `preview-artist-process-ring--${step}`,
          )}
        />
        <span
          className={cn(
            "preview-artist-process-tip absolute left-2 top-2 max-w-[34px] rounded bg-neutral-900 px-0.5 py-px text-[3px] font-medium leading-tight text-white shadow-lg",
            `preview-artist-process-tip--${step}`,
          )}
        >
          {hint}
        </span>
      </div>
    </div>
  );
}

const PREVIEW_IMAGES = {
  feesHero: "/images/assetsunt/backgraund.png",
  trustHero: "/images/assetsunt/backgraund.png",
  newsHero: "/images/fees/back.png",
  statusHero: "/images/fees/back.png",
  referralHero: "/images/partner-programtab=about/back.jpg",
  partnerHero: "/images/partner-programtab=about/back.jpg",
  trustRiskIcon: "/images/центрдвоерие/Риски и раскрытия.png",
  catalogThumb: "/images/catalog/1.png",
} as const;

const SCENE_BY_HREF: Record<string, string> = {
  [ROUTES.calculator]: "calc",
  [ROUTES.fees]: "fees",
  [ROUTES.systemStatus]: "status",
  [ROUTES.news]: "news",
  [ROUTES.referralProgram]: "referral",
  [ROUTES.partnerProgram]: "partner",
  [ROUTES.dashboardArtist]: "artist",
  [ROUTES.dashboardDisputes]: "disputes",
  [ROUTES.dashboardStatements]: "statements",
  [ROUTES.trust]: "trust",
};

function DarkScreenHeader({ title, tabs, activeTab }: { title: string; tabs: string[]; activeTab: string }) {
  return (
    <header className="-mx-2 -mt-2 mb-1 shrink-0 border-b border-white/6 bg-black/95 px-2 pb-1.5 pt-1.5">
      <p className="truncate text-[8px] font-semibold tracking-tight text-white md:text-[9px]">{title}</p>
      <nav className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 border-t border-white/6 pt-1" aria-hidden>
        {tabs.map((tab) => (
          <span
            key={tab}
            className={cn(
              "text-[6px] font-semibold",
              tab === activeTab ? "border-b border-white pb-0.5 text-white" : "text-zinc-500",
            )}
          >
            {tab}
          </span>
        ))}
      </nav>
    </header>
  );
}

function ServicesPreviewFrame({ dark, children }: { dark?: boolean; children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col overflow-visible">
      <p
        className={cn(
          "mb-1 shrink-0 text-[4.5px] font-semibold uppercase tracking-[0.16em]",
          dark ? "text-zinc-500" : "text-neutral-400",
        )}
      >
        {t("nav.misc")}
      </p>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function CalculatorScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-1 overflow-hidden">
      <section className="shrink-0 rounded-2xl bg-white px-2 py-2 ring-1 ring-neutral-100">
        <p className="text-[5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("nav.misc.assets.calculator.label")}
        </p>
        <p className="mt-0.5 text-[8px] font-semibold leading-tight tracking-tight text-neutral-900">
          {t("preview.megamenu.calc.title")}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[5px] leading-snug text-neutral-500">
          {t("preview.megamenu.calc.subtitle")}
        </p>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-white px-2 py-2 ring-1 ring-neutral-100">
        <p className="text-[5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("preview.megamenu.calc.buyUnt")}
        </p>
        <p className="mt-0.5 text-[7px] font-semibold tracking-tight text-neutral-900">
          {t("calculator.hero.title")}
        </p>

        <div className="relative mt-1 inline-flex rounded-full bg-neutral-100 p-0.5">
          <span className="preview-calc-toggle relative rounded-full bg-white px-2 py-0.5 text-[6px] font-semibold text-neutral-900 shadow-sm">
            {t("preview.megamenu.calc.toggleUsdt")}
            <BlockCursor
              step="calc-toggle"
              hint={t("preview.megamenu.calc.cursorToggle")}
              className="left-1/2 top-1/2 -translate-x-1/4 -translate-y-1/3"
            />
          </span>
          <span className="px-2 py-0.5 text-[6px] font-medium text-neutral-500">
            {t("preview.megamenu.calc.toggleUnt")}
          </span>
        </div>

        <div className="mt-1 grid grid-cols-[1fr_6px_1fr] items-stretch gap-0.5">
          <div className="preview-calc-input relative rounded-xl bg-neutral-50 p-1 ring-1 ring-neutral-200/80">
            <p className="text-[5px] font-medium text-neutral-500">{t("preview.megamenu.calc.paymentAmount")}</p>
            <p className="relative mt-0.5 h-[10px] font-mono text-[8px] font-semibold tabular-nums text-neutral-900">
              <span className="preview-calc-value-a absolute inset-0">1 000</span>
              <span className="preview-calc-value-b absolute inset-0">2 500</span>
            </p>
            <BlockCursor
              step="calc-input"
              hint={t("preview.megamenu.calc.cursorInput")}
              className="left-[55%] top-[58%]"
            />
          </div>
          <div className="flex items-center justify-center">
            <span className="size-2 rounded-full bg-neutral-100" aria-hidden />
          </div>
          <div className="rounded-xl bg-neutral-50 p-1 ring-1 ring-neutral-200/80">
            <p className="text-[5px] font-medium text-neutral-500">{t("preview.megamenu.calc.untPrice")}</p>
            <p className="mt-0.5 font-mono text-[8px] font-semibold tabular-nums text-neutral-900">12,50</p>
          </div>
        </div>

        <div className="preview-calc-result mt-1 rounded-xl bg-[#f6f7f9] px-1.5 py-1">
          <p className="text-[5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            {t("preview.megamenu.calc.result")}
          </p>
          <p className="text-[9px] font-semibold tabular-nums tracking-tight text-neutral-900">≈ 435 UNT</p>
        </div>

        <div className="mt-1 divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white px-1.5">
          <div className="preview-calc-fee relative flex items-center justify-between py-0.5">
            <span className="text-[5px] text-neutral-500">{t("fees.stat.platformFee")}</span>
            <span className="font-mono text-[5px] font-medium text-neutral-900">65 USDT</span>
            <BlockCursor step="calc-fee" hint={t("preview.megamenu.calc.cursorFee")} className="left-[45%] top-[40%]" />
          </div>
          <div className="preview-calc-net relative flex items-center justify-between py-0.5">
            <span className="text-[5px] text-neutral-700">{t("preview.megamenu.calc.netCredit")}</span>
            <span className="font-mono text-[5px] font-semibold text-neutral-900">2 435 USDT</span>
            <BlockCursor step="calc-net" hint={t("preview.megamenu.calc.cursorNet")} className="left-[45%] top-[40%]" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeesScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f6f7f9]">
      <PageHero
        title={t("fees.hero.title")}
        src={PREVIEW_IMAGES.feesHero}
        titleClassName="max-w-[92%] text-[9px] font-semibold leading-[1.05] tracking-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.55)]"
        heightClass="h-[34%] min-h-[48px]"
      />

      <div className="min-h-0 flex-1 space-y-1 overflow-hidden px-0.5 pt-0.5">
        <p className="rounded-xl bg-neutral-50 px-1.5 py-1 text-[5px] leading-snug text-neutral-700">
          {t("preview.megamenu.fees.banner")}
        </p>

        <div>
          <p className="text-[7px] font-semibold tracking-tight text-neutral-900">
            {t("preview.megamenu.fees.overviewTitle")}
          </p>
          <p className="text-[5px] text-neutral-500">{t("preview.megamenu.fees.overviewSubtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <article className="preview-fees-tile relative rounded-3xl bg-neutral-50/90 px-1.5 py-1.5">
            <p className="text-[5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {t("fees.stat.platformFee")}
            </p>
            <p className="mt-0.5 bg-linear-to-br from-blue-800 via-blue-700 to-indigo-700 bg-clip-text font-mono text-[10px] font-semibold text-transparent">
              2,6 %
            </p>
            <p className="mt-0.5 text-[5px] text-neutral-500">{t("fees.trading.primaryHint")}</p>
            <BlockCursor
              step="fees-tile"
              hint={t("preview.megamenu.fees.cursorTile")}
              className="left-[48%] top-[42%]"
            />
          </article>
          <article className="rounded-3xl bg-neutral-50/90 px-1.5 py-1.5">
            <p className="text-[5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {t("fees.stat.secondaryFee")}
            </p>
            <p className="mt-0.5 bg-linear-to-br from-emerald-800 via-teal-700 to-cyan-700 bg-clip-text font-mono text-[10px] font-semibold text-transparent">
              1,1 %
            </p>
            <p className="mt-0.5 text-[5px] text-neutral-500">{t("fees.trading.secondaryHint")}</p>
          </article>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_STATUS_CHIP_NAMES = PUBLIC_STATUS_COMPONENTS.map((component) => component.name);

function PreviewStatusUptimeBars() {
  return (
    <div className="preview-status-uptime flex items-end gap-px" aria-hidden>
      {Array.from({ length: 10 }).map((_, index) => (
        <span key={index} className="preview-status-uptime-bar bg-emerald-500" />
      ))}
    </div>
  );
}

function PreviewStatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="preview-status-pill inline-flex items-center gap-0.5">
      <span className="preview-status-pill-dot" aria-hidden />
      <span>{children}</span>
    </span>
  );
}

function StatusScene() {
  const { t } = useI18n();
  const [chipIndex, setChipIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setChipIndex((current) => (current + 1) % PREVIEW_STATUS_CHIP_NAMES.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const activeChip = PREVIEW_STATUS_CHIP_NAMES[chipIndex] ?? PREVIEW_STATUS_CHIP_NAMES[0]!;

  return (
    <div className="preview-status-page flex h-full flex-col overflow-hidden bg-[#0b0b0b] text-white">
      <div className="preview-status-page-hero relative shrink-0 px-1 pt-1 text-center">
        <PreviewCover
          src={PREVIEW_IMAGES.statusHero}
          className="absolute inset-0"
          imageClassName="object-top opacity-35"
          overlayClassName="bg-black/45"
          fadeClassName="bg-linear-to-b from-transparent to-[#0b0b0b]"
        />
        <div className="relative z-10 py-2">
          <h2 className="text-[8px] font-semibold tracking-tight text-white">{t("systemStatus.hero.title")}</h2>
          <p className="mt-0.5 line-clamp-2 px-2 text-[4.5px] leading-snug text-zinc-300">
            {t("systemStatus.hero.subtitle")}
          </p>
        </div>
      </div>

      <section className="preview-status-overall shrink-0 border-b border-white/[0.06] px-1 pb-1.5 text-center">
        <p className="text-[4px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          {t("preview.megamenu.status.overallLabel")}
        </p>

        <div className="preview-status-overall-wrap mx-auto mt-1">
          <div className="preview-status-sync">
            <p className="text-[3.5px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              {t("preview.megamenu.status.syncLabel")}
            </p>
            <p className="preview-status-sync-name line-clamp-1 text-[4.5px] font-medium text-zinc-300">{activeChip}</p>
          </div>

          <div className="preview-status-rail relative mx-auto mt-1 h-2 w-full max-w-[88%]">
            <span className="preview-status-rail-line absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/[0.08]" />
            <span className="preview-status-rail-target absolute right-0 top-1/2 size-1 -translate-y-1/2 rounded-full border border-white/20" />
            {activeChip ? (
              <span
                key={`${chipIndex}-${activeChip}`}
                className="preview-status-fly-chip preview-status-fly-chip--rail"
              >
                <span className="preview-status-fly-chip-dot" aria-hidden />
                <span className="preview-status-fly-chip-label line-clamp-1">{activeChip}</span>
              </span>
            ) : null}
          </div>

          <div className="preview-status-orb relative mx-auto mt-1">
            <span className="preview-status-ring preview-status-ring--spin pointer-events-none absolute inset-0 rounded-full border border-white/[0.08]" aria-hidden>
              <span className="preview-status-orbit-dot absolute left-1/2 top-0.5 size-0.5 -translate-x-1/2 rounded-full bg-emerald-400" />
            </span>
            <span className="preview-status-logo relative z-10 flex size-4 items-center justify-center overflow-hidden rounded-[3px] bg-black">
              <Image
                src="/images/LOGO/mini-logo.png"
                alt=""
                width={14}
                height={14}
                className="size-2.5 object-contain"
                unoptimized
              />
            </span>
          </div>
        </div>

        <p className="mt-1 text-[6px] font-semibold tracking-tight text-white">
          {t("preview.megamenu.status.allOperational")}
        </p>
        <p className="mt-0.5 line-clamp-1 px-1 text-[4px] text-zinc-400">
          {t("preview.megamenu.status.contourNormal")}
        </p>
        <p className="mt-0.5 font-mono text-[3.5px] text-zinc-600">{t("preview.megamenu.status.updatedApi")}</p>
      </section>

      <div className="mt-1 min-h-0 flex-1 overflow-hidden px-0.5">
        <div className="flex items-end justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[5.5px] font-semibold tracking-tight text-white">{t("systemStatus.services.title")}</p>
            <p className="text-[4px] text-zinc-500">
              {tf(t("preview.megamenu.status.componentsMeta"), {
                count: String(PUBLIC_STATUS_COMPONENTS.length),
              })}
            </p>
          </div>
          <div className="preview-status-search relative h-2.5 w-[38%] shrink-0 rounded-full bg-zinc-900/80">
            <Search className="pointer-events-none absolute left-1 top-1/2 size-1.5 -translate-y-1/2 text-zinc-600" aria-hidden />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[3px] text-zinc-600">
              {t("preview.megamenu.status.searchShort")}
            </span>
          </div>
        </div>

        <div className="preview-status-table mt-0.5 min-h-0 flex-1 overflow-hidden">
          <table className="w-full min-w-0 border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-[3px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                <th className="pb-0.5 pr-0.5 font-medium">{t("systemStatus.services.col.service")}</th>
                <th className="pb-0.5 pr-0.5 font-medium">{t("systemStatus.services.col.status")}</th>
                <th className="pb-0.5 pr-0.5 font-medium">{t("systemStatus.services.col.uptime")}</th>
                <th className="pb-0.5 font-medium">{t("preview.megamenu.status.colWorks")}</th>
              </tr>
            </thead>
            <tbody className="preview-status-table-body block max-h-[52px] overflow-hidden">
              {PUBLIC_STATUS_COMPONENTS.map((component, index) => (
                <tr
                  key={component.code}
                  className={cn(
                    "table w-full table-fixed border-b border-white/[0.06] last:border-b-0",
                    index === 4 && "preview-status-row",
                  )}
                >
                  <td className="py-0.5 pr-0.5 align-top">
                    <div className="flex gap-0.5">
                      <span className="mt-px size-1 shrink-0 rounded-full border border-zinc-600" aria-hidden />
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-[4px] font-medium text-white">{component.name}</p>
                        <p className="line-clamp-1 text-[3px] leading-snug text-zinc-500">{component.note}</p>
                      </div>
                    </div>
                  </td>
                  <td className={cn("relative py-0.5 pr-0.5 align-middle", index === 4 && "z-10")}>
                    <PreviewStatusPill>{t("preview.megamenu.status.pillNormal")}</PreviewStatusPill>
                    {index === 4 ? (
                      <BlockCursor
                        step="status-row"
                        hint={t("preview.megamenu.status.cursorRow")}
                        className="left-[50%] top-[38%]"
                      />
                    ) : null}
                  </td>
                  <td className="py-0.5 pr-0.5 align-middle">
                    <PreviewStatusUptimeBars />
                  </td>
                  <td className="py-0.5 align-middle text-[3px] text-zinc-500">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NewsScene() {
  const { t } = useI18n();
  const articles = newsArticlesMock.slice(0, 4);
  const total = newsArticlesMock.length;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-black text-white">
      <div className="shrink-0 border-b border-white/[0.06] pb-1">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-[4.5px] font-medium text-zinc-500">
            {t("news.breadcrumb")} <span className="mx-0.5 text-zinc-700">›</span>{" "}
            <span className="text-zinc-300">{t("news.breadcrumbBlog")}</span>
          </p>
          <div className="preview-news-search relative h-3 w-[44%] shrink-0 rounded-full border border-white/10 bg-zinc-950">
            <span
              className="pointer-events-none absolute left-1 top-1/2 size-[3px] -translate-y-1/2 rounded-full border border-zinc-600"
              aria-hidden
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[3.5px] text-zinc-600">
              {t("news.searchPlaceholder")}
            </span>
          </div>
        </div>

        <nav className="preview-news-filters mt-1 flex gap-2 overflow-hidden" aria-hidden>
          {NEWS_CATEGORY_FILTERS.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                "preview-news-filter shrink-0 text-[4.5px] font-semibold",
                `preview-news-filter--${index}`,
                index === 0 ? "text-white" : "text-zinc-500",
              )}
            >
              {t(`news.category.${item.id}`)}
            </span>
          ))}
        </nav>

        <div className="mt-1">
          <h2 className="text-[7px] font-semibold tracking-tight text-white">
            {tf(t("preview.megamenu.news.blogTitleWithCount"), { count: String(total) })}
          </h2>
          <p className="mt-px text-[4px] text-zinc-500">{t("news.blogSubtitle")}</p>
        </div>
      </div>

      <div className="mt-1 grid min-h-0 flex-1 grid-cols-2 gap-1.5 overflow-hidden">
        {articles.map((article, index) => {
          const categoryLabel = t(`news.category.${article.category}`).toUpperCase();

          return (
            <article
              key={article.id}
              className={cn(
                "preview-news-mini-card flex min-h-0 flex-col",
                index === 0 && "preview-news-mini-card--featured",
              )}
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-zinc-900 ring-1 ring-white/[0.06]">
                <Image
                  src={article.coverUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                  unoptimized
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                  aria-hidden
                />
                {article.isNew ? (
                  <span className="absolute left-0.5 top-0.5 rounded-full bg-[#B7F500] px-1 py-px text-[3px] font-bold uppercase tracking-wide text-black">
                    New
                  </span>
                ) : null}
                {index === 0 ? (
                  <BlockCursor
                    step="news-card"
                    hint={t("preview.megamenu.news.cursorCard")}
                    className="left-[55%] top-[55%]"
                  />
                ) : null}
              </div>
              <p className="mt-0.5 text-[3px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {categoryLabel}
              </p>
              <h3 className="line-clamp-2 text-[4.5px] font-semibold leading-snug text-white">{article.title}</h3>
              <p className="mt-px text-[3px] text-zinc-600">
                <time dateTime={article.isoDate}>{article.dateLabel}</time>
                <span aria-hidden> · </span>
                <span>{formatReadTimeLabel(article.readTimeMinutes)}</span>
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ReferralScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-black text-white">
      <DarkScreenHeader
        title={t("referral.screen.title")}
        tabs={[t("referral.tab.program"), t("referral.tab.rewards")]}
        activeTab={t("referral.tab.program")}
      />

      <section className="relative mx-0.5 shrink-0 overflow-hidden rounded-3xl ring-1 ring-white/10">
        <PreviewCover src={PREVIEW_IMAGES.referralHero} className="h-[56px]" imageClassName="opacity-42" overlayClassName="bg-black/56" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          <p className="text-[7px] font-semibold leading-tight tracking-tight text-white">
            {t("referral.program.hero.title")}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[5px] leading-snug text-zinc-300">
            {t("referral.program.hero.subtitle")}
          </p>
        </div>
      </section>

      <div className="mt-1 min-h-0 flex-1 space-y-1 px-0.5">
        <div className="rounded-3xl bg-[#121212] p-1.5">
          <p className="text-[5px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("referral.program.copy.link")}
          </p>
          <div className="relative mt-0.5 flex items-center gap-1">
            <div className="min-w-0 flex-1 truncate rounded-xl bg-black px-1.5 py-1 font-mono text-[5px] text-zinc-200 ring-1 ring-white/10">
              spliton.io/r/danila
            </div>
            <span className="preview-referral-copy relative flex h-4 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/12 bg-[#0a0a0a] px-1.5 text-[5px] font-semibold text-zinc-100 ring-1 ring-white/10">
              <span className="preview-referral-copy-idle">{t("referral.program.copy.copy")}</span>
              <span className="preview-referral-copy-done">{t("referral.program.copy.copied")}</span>
              <BlockCursor
                step="referral-copy"
                hint={t("preview.megamenu.referral.cursorCopy")}
                className="left-[72%] top-[35%]"
              />
            </span>
          </div>
          <p className="mt-1 text-[5px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("referral.program.copy.code")}
          </p>
          <div className="mt-0.5 truncate rounded-xl bg-black px-1.5 py-1 font-mono text-[5px] text-zinc-200 ring-1 ring-white/10">
            DANILA2026
          </div>
        </div>
      </div>
    </div>
  );
}

function PartnerScene() {
  const { t } = useI18n();
  const partnerTabs = [
    t("partner.tab.about"),
    t("partner.tab.process"),
    t("partner.tab.community"),
    t("partner.tab.faq"),
  ];
  const partnerSteps = [
    t("partner.application.step.apply"),
    t("preview.megamenu.partner.stepReview"),
    t("preview.megamenu.partner.stepOnboard"),
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-black text-white">
      <DarkScreenHeader title={t("partner.screen.title")} tabs={partnerTabs} activeTab={partnerTabs[0]!} />

      <section className="relative mx-0.5 shrink-0 overflow-hidden rounded-2xl">
        <PreviewCover
          src={PREVIEW_IMAGES.partnerHero}
          className="h-[46px]"
          imageClassName="opacity-55"
          overlayClassName="bg-black/28"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_75%_at_80%_0%,rgba(255,255,255,0.12),transparent_55%)]" aria-hidden />
        <div className="absolute inset-0 grid grid-cols-[1.05fr_0.95fr] gap-1 px-1.5 py-1.5">
          <div className="flex flex-col justify-end">
            <p className="text-[5.5px] font-semibold leading-tight tracking-tight text-white">
              {t("preview.megamenu.partner.heroTitle")}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[4.5px] leading-snug text-zinc-200">
              {t("preview.megamenu.partner.heroSubtitle")}
            </p>
          </div>
          <div className="flex flex-col justify-end rounded-xl bg-black/45 p-1 text-right backdrop-blur-sm">
            <p className="font-mono text-[3.5px] uppercase tracking-[0.12em] text-zinc-400">
              {t("partner.about.metrics.live.title")}
            </p>
            <p className="mt-0.5 text-[5px] font-semibold leading-snug text-white">
              {t("partner.about.metrics.live.heading")}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[4px] leading-snug text-zinc-300">
              {t("partner.about.metrics.live.text")}
            </p>
          </div>
        </div>
      </section>

      <section className="preview-partner-how mx-0.5 mt-1 shrink-0 overflow-hidden rounded-xl bg-black/45 backdrop-blur-[1px]">
        <div className="flex h-3 items-center gap-1 bg-black/40 px-1.5">
          <span className="size-1 rounded-full bg-red-400/90" aria-hidden />
          <span className="size-1 rounded-full bg-amber-400/90" aria-hidden />
          <span className="size-1 rounded-full bg-emerald-400/90" aria-hidden />
          <span className="ml-0.5 truncate text-[4px] font-medium text-zinc-500">{t("partner.how.chrome")}</span>
        </div>
        <div className="relative h-[26px] overflow-hidden bg-black/35">
          <div className="preview-partner-how-panel preview-partner-how-panel--apply absolute inset-0 px-1.5 py-1">
            <p className="text-[4px] font-semibold text-white">{t("partner.how.panel.applyTitle")}</p>
            <div className="mt-0.5 rounded-md bg-black/40 px-1 py-0.5 text-[3.5px] text-zinc-300">
              Affiliate · Telegram · 24k
            </div>
          </div>
          <div className="preview-partner-how-panel preview-partner-how-panel--review absolute inset-0 px-1.5 py-1">
            <p className="text-[4px] font-semibold text-white">{t("partner.how.panel.reviewTitle")}</p>
            <div className="mt-0.5 rounded-md bg-amber-500/10 px-1 py-0.5 text-center text-[3px] text-amber-100">
              {t("preview.megamenu.partner.reviewStatus")}
            </div>
          </div>
          <div className="preview-partner-how-panel preview-partner-how-panel--onboard absolute inset-0 px-1.5 py-1">
            <p className="text-[4px] font-semibold text-white">{t("preview.megamenu.partner.welcomeTitle")}</p>
            <p className="mt-0.5 font-mono text-[3.5px] text-[#d4f570]">spliton.io/r/partner-7f2a</p>
          </div>
        </div>
        <div className="h-0.5 bg-black/50">
          <div className="preview-partner-how-progress h-full bg-[#B7F500]" />
        </div>
        <div className="grid grid-cols-3 gap-0.5 px-1 py-0.5">
          {partnerSteps.map((label) => (
            <p key={label} className="truncate text-center text-[3px] text-zinc-500">
              {label}
            </p>
          ))}
        </div>
      </section>

      <section className="preview-partner-cabinet relative mx-0.5 mt-1 min-h-0 flex-1 overflow-hidden rounded-xl">
        <PreviewCover src={PREVIEW_IMAGES.partnerHero} className="absolute inset-0" imageClassName="opacity-50" overlayClassName="bg-black/58" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#B7F500]/85" aria-hidden />
        <div className="relative flex h-full items-center justify-between gap-1 px-1.5 py-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/70">
              <Image src="/images/LOGO/mini-logo.png" alt="" width={12} height={12} className="size-2.5 object-contain" unoptimized />
            </span>
            <div className="min-w-0">
              <p className="text-[3.5px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                {t("partner.application.brand")}
              </p>
              <p className="truncate text-[5px] font-semibold text-white">{t("partner.application.cabinet.title")}</p>
            </div>
          </div>
          <span className="preview-partner-cta relative shrink-0 rounded-full bg-[#B7F500] px-1.5 py-0.5 text-[4.5px] font-semibold text-black">
            {t("partner.about.apply")}
            <BlockCursor
              step="partner-cta"
              hint={t("preview.megamenu.partner.cursorCta")}
              className="left-[58%] top-[45%]"
            />
          </span>
        </div>
      </section>

      <div className="preview-partner-modal-overlay pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-2 backdrop-blur-[2px]">
        <div className="preview-partner-modal relative w-[84%] overflow-hidden rounded-xl">
          <PreviewCover src={PREVIEW_IMAGES.partnerHero} className="absolute inset-0" imageClassName="opacity-35" overlayClassName="bg-black/75" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#B7F500]/85" aria-hidden />
          <div className="relative px-2 py-1.5">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[5px] font-semibold text-white">{t("partner.survey.title")}</p>
              <span className="rounded bg-white/10 px-1 py-px text-[4px] tabular-nums text-zinc-300">1 / 3</span>
            </div>
            <p className="mt-0.5 text-[4px] font-medium leading-snug text-white">
              {t("preview.megamenu.partner.surveyQuestion")}
            </p>
            <div className="preview-partner-survey-opt mt-1 rounded-md bg-black/45 px-1 py-0.5 text-[3.5px] text-zinc-200">
              {t("preview.megamenu.partner.surveyOptRegistrations")}
            </div>
            <div className="mt-0.5 rounded-md bg-black/30 px-1 py-0.5 text-[3.5px] text-zinc-400">
              {t("preview.megamenu.partner.surveyOptActivity")}
            </div>
            <span className="preview-partner-modal-next mt-1 ml-auto flex w-fit rounded-full bg-white px-1.5 py-0.5 text-[4px] font-semibold text-black">
              {t("partner.survey.next")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtistScene() {
  const { t } = useI18n();
  const processSteps = [
    {
      n: "01",
      stepId: 1 as const,
      className: "preview-artist-process-card--1",
      title: t("artist.onboarding.process.step1.title"),
      desc: t("artist.onboarding.process.step1.description"),
      hint: t("artist.onboarding.process.step1.hint"),
    },
    {
      n: "02",
      stepId: 2 as const,
      className: "preview-artist-process-card--2",
      title: t("artist.onboarding.process.step2.title"),
      desc: t("artist.onboarding.process.step2.description"),
      hint: t("artist.onboarding.process.step2.hint"),
    },
    {
      n: "03",
      stepId: 3 as const,
      className: "preview-artist-process-card--3",
      title: t("artist.onboarding.process.step3.title"),
      desc: t("artist.onboarding.process.step3.description"),
      hint: t("artist.onboarding.process.step3.hint"),
    },
  ] as const;

  return (
    <div className="flex h-full min-h-[120px] flex-col gap-1 overflow-hidden">
      <section className="preview-artist-hero-wrap relative shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-100">
        <span className="preview-artist-hero-aurora pointer-events-none absolute inset-0" aria-hidden>
          <span className="preview-artist-hero-aurora__halo" />
        </span>

        <div className="relative z-[1] grid grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div className="flex flex-col justify-center px-1.5 py-1.5">
            <Image
              src="/images/LOGO/mini-logo.png"
              alt=""
              width={14}
              height={14}
              className="size-3 rounded-md object-contain"
              unoptimized
            />
            <p className="mt-1 text-[6px] font-semibold leading-tight tracking-tight text-neutral-900">
              {t("artist.onboarding.hero.title")}
            </p>
            <p className="mt-0.5 line-clamp-3 text-[4px] leading-snug text-neutral-600">
              {t("artist.onboarding.hero.description")}
            </p>
            <div className="preview-artist-cta mt-1 flex flex-wrap gap-0.5">
              <span className="preview-artist-cta-primary relative rounded-md bg-black px-1.5 py-0.5 text-[4px] font-semibold text-white">
                {t("artist.onboarding.hero.applyCta")}
                <BlockCursor
                  step="artist-submit"
                  hint={t("preview.megamenu.artist.cursorSubmit")}
                  className="left-[55%] top-[42%]"
                />
              </span>
              <span className="rounded-md bg-[#F5F5F5] px-1.5 py-0.5 text-[4px] font-semibold text-neutral-900">
                {t("artist.onboarding.hero.howItWorks")}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-0.5">
              {ISSUER_FEATURE_CONFIG.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.id} className="min-w-0">
                    <span className="inline-flex size-2.5 items-center justify-center rounded-[3px] bg-[#F5F5F5]" aria-hidden>
                      <Icon className="size-1.5 text-neutral-900" />
                    </span>
                    <p className="mt-0.5 truncate text-[3.5px] font-semibold leading-tight text-neutral-900">
                      {t(`artist.onboarding.features.${feature.id}.title`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[54px] overflow-hidden bg-[linear-gradient(180deg,#fafafa_0%,#f3f4f6_100%)]">
            <Image
              src={ISSUER_PREVIEW.portalHero}
              alt=""
              width={120}
              height={96}
              className="absolute inset-x-0 bottom-0 mx-auto h-[92%] w-auto max-w-full object-contain object-bottom"
              unoptimized
            />
          </div>
        </div>
      </section>

      <section className="preview-artist-process-section relative min-h-0 flex-1 overflow-hidden rounded-xl">
        <div className="pointer-events-none absolute -inset-[5%] overflow-hidden" aria-hidden>
          <div className="preview-artist-process-bg relative h-full w-full">
            <Image
              src={ISSUER_PREVIEW.processBg}
              alt=""
              fill
              className="object-cover object-center"
              sizes="200px"
              unoptimized
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-black/58" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.1),transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col px-1.5 py-1.5">
          <p className="text-[3.5px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("artist.onboarding.process.kicker")}
          </p>
          <p className="mt-0.5 text-[5.5px] font-semibold tracking-tight text-white">
            {t("artist.onboarding.process.title")}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[4px] leading-snug text-zinc-300">
            {t("artist.onboarding.process.subtitle")}
          </p>

          <div className="preview-artist-process-track mt-1 h-0.5 overflow-hidden rounded-full bg-white/10">
            <span className="preview-artist-process-fill block h-full rounded-full bg-[#B7F500] shadow-[0_0_6px_rgba(183,245,0,0.55)]" />
          </div>

          <div className="mt-1 grid min-h-0 flex-1 grid-cols-3 gap-0.5">
            {processSteps.map((step) => (
              <article
                key={step.n}
                className={cn(
                  "preview-artist-process-card relative flex flex-col rounded-md px-1 py-1 ring-1 ring-white/10",
                  step.className,
                )}
              >
                <PreviewArtistProcessCursor step={step.stepId} hint={step.hint} />

                <span
                  className={cn(
                    "preview-artist-process-check pointer-events-none absolute right-0.5 top-0.5 inline-flex size-2 items-center justify-center rounded-full bg-emerald-500/15",
                    `preview-artist-process-check--${step.stepId}`,
                  )}
                  aria-hidden
                >
                  <Check className="size-1 stroke-[3] text-emerald-300" />
                </span>

                {step.stepId === 2 ? (
                  <span
                    className="preview-artist-process-spinner pointer-events-none absolute right-0.5 top-0.5 inline-flex size-2 items-center justify-center rounded-full bg-white/10"
                    aria-hidden
                  >
                    <span className="size-1 animate-spin rounded-full border border-white/25 border-t-white/90" />
                  </span>
                ) : null}

                <p
                  className={cn(
                    "preview-artist-process-number font-mono text-[5px] font-semibold tabular-nums",
                    `preview-artist-process-number--${step.stepId}`,
                  )}
                >
                  {step.n}
                </p>
                <p
                  className={cn(
                    "preview-artist-process-title mt-0.5 text-[4px] font-semibold leading-tight",
                    `preview-artist-process-title--${step.stepId}`,
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    "preview-artist-process-text mt-0.5 line-clamp-3 text-[3.5px] leading-snug",
                    `preview-artist-process-text--${step.stepId}`,
                  )}
                >
                  {step.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DisputesScene() {
  const { t } = useI18n();
  const kpiItems = [
    { label: t("preview.megamenu.disputes.kpiTotal"), value: "1" },
    { label: t("disputes.metrics.active"), value: "1" },
    { label: t("disputes.metrics.resolved"), value: "0" },
  ];
  const disputeSteps = [
    { id: 1, label: t("disputes.step.accepted"), active: true },
    { id: 2, label: t("disputes.step.review"), active: false },
    { id: 3, label: t("preview.megamenu.disputes.stepResponse"), active: false },
    { id: 4, label: t("preview.megamenu.disputes.stepResolution"), active: false },
  ];

  return (
    <div className="flex h-full flex-col gap-1 overflow-hidden">
      <div className="grid shrink-0 grid-cols-3 gap-0.5 px-0.5">
        {kpiItems.map((item) => (
          <div key={item.label} className="rounded-lg bg-neutral-50 px-1 py-1">
            <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{item.label}</p>
            <p className="mt-0.5 font-mono text-[6px] font-semibold tabular-nums text-neutral-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-1 px-0.5 pb-0.5">
        <section className="flex min-h-0 flex-col rounded-xl bg-white p-1.5 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.14)]">
          <p className="text-[6px] font-semibold text-neutral-900">{t("disputes.create.title")}</p>
          <p className="mt-0.5 text-[4.5px] leading-snug text-neutral-500">{t("disputes.create.subtitle")}</p>

          <div className="preview-disputes-type relative mt-1.5">
            <p className="text-[4.5px] font-medium text-neutral-700">{t("disputes.create.typeLabel")}</p>
            <div className="mt-0.5 rounded-md bg-[#F5F5F5] px-1.5 py-1 text-[5.5px] text-neutral-900">
              {t("disputes.type.withdrawal_not_received")}
            </div>
            <BlockCursor
              step="disputes-type"
              hint={t("preview.megamenu.disputes.cursorType")}
              className="left-[52%] top-[58%]"
            />
          </div>

          <div className="preview-disputes-subject relative mt-1">
            <p className="text-[4.5px] font-medium text-neutral-700">{t("disputes.create.subjectLabel")}</p>
            <div className="relative mt-0.5 rounded-md bg-[#F5F5F5] px-1.5 py-1">
              <p className="text-[5.5px] text-neutral-400">{t("disputes.create.subjectPlaceholder")}</p>
              <p className="preview-disputes-subject-typed absolute inset-0 flex items-center px-1.5 text-[5.5px] font-medium text-neutral-900 opacity-0">
                {t("preview.megamenu.disputes.subjectTyped")}
              </p>
            </div>
            <BlockCursor
              step="disputes-subject"
              hint={t("preview.megamenu.disputes.cursorSubject")}
              className="left-[52%] top-[58%]"
            />
          </div>

          <div className="preview-disputes-description relative mt-1">
            <p className="text-[4.5px] font-medium text-neutral-700">{t("disputes.create.descriptionLabel")}</p>
            <div className="relative mt-0.5 min-h-[18px] rounded-md bg-[#F5F5F5] px-1.5 py-1">
              <p className="text-[5px] leading-snug text-neutral-400">{t("disputes.create.descriptionPlaceholder")}</p>
              <p className="preview-disputes-desc-typed absolute inset-0 px-1.5 py-1 text-[4.5px] leading-snug text-neutral-800 opacity-0">
                {t("preview.megamenu.disputes.descriptionTyped")}
              </p>
            </div>
            <BlockCursor
              step="disputes-description"
              hint={t("preview.megamenu.disputes.cursorDescription")}
              className="left-[52%] top-[55%]"
            />
          </div>

          <div className="mt-1">
            <p className="text-[4.5px] font-medium text-neutral-700">{t("disputes.create.amountLabel")}</p>
            <div className="mt-0.5 rounded-md bg-[#F5F5F5] px-1.5 py-1 font-mono text-[5.5px] text-neutral-900">200,00 USDT</div>
          </div>

          <button
            type="button"
            className="preview-disputes-submit relative mt-auto w-full rounded-md bg-black py-1 text-[5.5px] font-semibold text-white"
          >
            {t("disputes.create.submit")}
            <BlockCursor step="disputes-submit" hint={t("disputes.create.submit")} className="left-[55%] top-[42%]" />
          </button>
        </section>

        <section className="preview-disputes-doc relative min-h-0 overflow-hidden rounded-xl bg-white shadow-[0_10px_28px_-16px_rgba(0,0,0,0.18)]">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-[#B7F500]" aria-hidden />

          <div className="preview-disputes-doc-idle flex h-full flex-col px-1.5 py-1.5">
            <div className="flex items-start justify-between gap-1">
              <Image
                src="/images/LOGO/black-logo-nofon.png"
                alt=""
                width={48}
                height={12}
                className="h-2.5 w-auto object-contain object-left"
                unoptimized
              />
              <div className="text-right">
                <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  {t("disputes.doc.ticketLabel")}
                </p>
                <p className="font-mono text-[5px] font-semibold text-neutral-900">{t("disputes.preview.draft")}</p>
                <p className="mt-0.5 text-[4px] text-neutral-400">{t("disputes.doc.placeholder.date")}</p>
              </div>
            </div>

            <div className="mt-1 flex items-start justify-between gap-1">
              <div>
                <p className="text-[5.5px] font-semibold text-neutral-900">{t("disputes.doc.heading")}</p>
                <p className="text-[4.5px] text-neutral-500">{t("disputes.type.withdrawal_not_received")}</p>
              </div>
              <span className="rounded bg-neutral-100 px-1 py-px text-[4px] font-bold uppercase tracking-[0.08em] text-neutral-600">
                {t("disputes.doc.stamp.draft")}
              </span>
            </div>

            <div className="mt-1 grid grid-cols-2 gap-1 rounded-md bg-neutral-50 px-1 py-1 text-[4.5px]">
              <div>
                <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                  {t("disputes.doc.applicant")}
                </p>
                <p className="mt-0.5 text-neutral-400">{t("disputes.doc.placeholder.holder")}</p>
              </div>
              <div>
                <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                  {t("disputes.doc.responseDue")}
                </p>
                <p className="mt-0.5 font-mono text-neutral-800">{t("disputes.doc.responseDueDefault")}</p>
              </div>
            </div>

            <div className="mt-1 overflow-hidden rounded-md bg-neutral-50">
              <div className="bg-neutral-900 px-1 py-0.5">
                <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-white/90">
                  {t("preview.megamenu.disputes.docContentHeading")}
                </p>
              </div>
              <div className="space-y-1 px-1 py-1">
                <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                  {t("disputes.doc.subjectLabel")}
                </p>
                <p className="text-[4.5px] text-neutral-400">{t("disputes.create.subjectPlaceholder")}</p>
                <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                  {t("disputes.doc.amountLabel")}
                </p>
                <p className="text-[4.5px] text-neutral-400">{t("disputes.doc.placeholder.amount")}</p>
              </div>
            </div>

            <p className="mt-auto text-[4px] leading-snug text-neutral-400">
              {t("preview.megamenu.disputes.docIdleFooter")}
            </p>
          </div>

          <div className="preview-disputes-doc-ready absolute inset-0 flex flex-col px-1.5 py-1.5">
            <div className="flex items-start justify-between gap-1">
              <Image
                src="/images/LOGO/black-logo-nofon.png"
                alt=""
                width={48}
                height={12}
                className="h-2.5 w-auto object-contain object-left"
                unoptimized
              />
              <div className="text-right">
                <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  {t("disputes.doc.ticketLabel")}
                </p>
                <p className="font-mono text-[5px] font-semibold text-neutral-900">DS-8F3A2B1C</p>
                <p className="mt-0.5 text-[4px] text-neutral-500">11 июня 2026</p>
              </div>
            </div>

            <div className="mt-1 flex items-start justify-between gap-1">
              <div>
                <p className="text-[5.5px] font-semibold text-neutral-900">{t("disputes.doc.heading")}</p>
                <p className="text-[4.5px] text-neutral-500">{t("disputes.type.withdrawal_not_received")}</p>
              </div>
              <span className="rounded bg-amber-50 px-1 py-px text-[4px] font-bold uppercase tracking-[0.08em] text-amber-900">
                {t("disputes.doc.stamp.open")}
              </span>
            </div>

            <div className="mt-1 overflow-hidden rounded-md bg-neutral-50">
              <div className="bg-neutral-900 px-1 py-0.5">
                <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-white/90">
                  {t("preview.megamenu.disputes.docContentHeading")}
                </p>
              </div>
              <div className="space-y-0.5 px-1 py-1 text-[4.5px]">
                <p className="font-semibold text-neutral-900">{t("preview.megamenu.disputes.subjectTyped")}</p>
                <p className="leading-snug text-neutral-600">{t("preview.megamenu.disputes.descriptionTyped")}</p>
                <div className="flex justify-between pt-0.5 text-neutral-600">
                  <span>{t("disputes.doc.amountLabel")}</span>
                  <span className="font-mono font-semibold text-neutral-900">200,00 USDT</span>
                </div>
              </div>
            </div>

            <div className="preview-disputes-steps mt-1 grid grid-cols-4 gap-px">
              {disputeSteps.map((step) => (
                <div key={step.id} className="flex flex-col items-center gap-0.5 text-center">
                  <span
                    className={cn(
                      "preview-disputes-step flex size-3 items-center justify-center rounded-full text-[4px] font-bold",
                      step.active ? "bg-[#B7F500] text-black" : "bg-neutral-100 text-neutral-400",
                    )}
                    style={{ animationDelay: `${step.id * 70}ms` }}
                  >
                    {step.active ? "✓" : step.id}
                  </span>
                  <span className="text-[3.5px] text-neutral-500">{step.label}</span>
                </div>
              ))}
            </div>

            <p className="mt-auto rounded-md bg-neutral-50 px-1 py-0.5 text-[4px] text-neutral-600">
              {t("disputes.doc.processingNotice")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatementsScene() {
  const { t } = useI18n();
  const kpiItems = [
    { label: t("preview.megamenu.statements.kpiBalance"), value: "0,00" },
    { label: t("preview.megamenu.statements.kpiOps"), value: "0" },
    { label: t("preview.megamenu.statements.kpiInflow"), value: "+0" },
    { label: t("preview.megamenu.statements.kpiOutflow"), value: "−0" },
  ];

  return (
    <div className="flex h-full flex-col gap-1 overflow-hidden">
      <div className="grid shrink-0 grid-cols-4 gap-0.5 px-0.5">
        {kpiItems.map((item) => (
          <div key={item.label} className="rounded-lg bg-neutral-50 px-1 py-1">
            <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{item.label}</p>
            <p className="mt-0.5 font-mono text-[6px] font-semibold tabular-nums text-neutral-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-1 px-0.5 pb-0.5">
        <section className="flex min-h-0 flex-col rounded-xl bg-white p-1.5 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.14)]">
          <p className="text-[6px] font-semibold text-neutral-900">{t("statements.page.request.title")}</p>
          <p className="mt-0.5 text-[4.5px] leading-snug text-neutral-500">
            {t("preview.megamenu.statements.requestSubtitle")}
          </p>

          <div className="preview-statements-kind relative mt-1.5">
            <p className="text-[4.5px] font-medium text-neutral-700">{t("statements.page.request.kindLabel")}</p>
            <div className="mt-0.5 rounded-md bg-[#F5F5F5] px-1.5 py-1 text-[5.5px] text-neutral-900">
              {t("statements.kind.annual_income_statement")}
            </div>
            <BlockCursor
              step="statements-kind"
              hint={t("preview.megamenu.statements.cursorKind")}
              className="left-[52%] top-[58%]"
            />
          </div>

          <div className="preview-statements-period relative mt-1">
            <p className="text-[4.5px] font-medium text-neutral-700">{t("statements.page.request.periodLabel")}</p>
            <div className="mt-0.5 rounded-md bg-[#F5F5F5] px-1.5 py-1 text-[5.5px] text-neutral-900">
              {t("statements.period.year-2026")}
            </div>
            <BlockCursor
              step="statements-period"
              hint={t("preview.megamenu.statements.cursorPeriod")}
              className="left-[52%] top-[58%]"
            />
          </div>

          <button
            type="button"
            className="preview-statements-generate relative mt-auto w-full rounded-md bg-black py-1 text-[5.5px] font-semibold text-white"
          >
            {t("statements.page.request.submit")}
            <BlockCursor
              step="statements-generate"
              hint={t("preview.megamenu.statements.cursorGenerate")}
              className="left-[55%] top-[42%]"
            />
          </button>
        </section>

        <section className="preview-statements-doc relative min-h-0 overflow-hidden rounded-xl bg-white shadow-[0_10px_28px_-16px_rgba(0,0,0,0.18)]">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-[#B7F500]" aria-hidden />
          <div className="preview-statements-doc-idle flex h-full flex-col px-1.5 py-1.5">
            <div className="flex items-start justify-between gap-1">
              <Image
                src="/images/LOGO/black-logo-nofon.png"
                alt=""
                width={48}
                height={12}
                className="h-2.5 w-auto object-contain object-left"
                unoptimized
              />
              <div className="text-right">
                <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  {t("statements.preview.referenceLabel")}
                </p>
                <p className="font-mono text-[5px] font-semibold text-neutral-900">ST-PREVIEW</p>
              </div>
            </div>
            <p className="mt-1.5 text-[5px] text-neutral-400">{t("preview.megamenu.statements.idleHint")}</p>
          </div>

          <div className="preview-statements-doc-ready absolute inset-0 flex flex-col px-1.5 py-1.5">
            <div className="flex items-start justify-between gap-1">
              <Image
                src="/images/LOGO/black-logo-nofon.png"
                alt=""
                width={48}
                height={12}
                className="h-2.5 w-auto object-contain object-left"
                unoptimized
              />
              <span className="rounded bg-emerald-50 px-1 py-px text-[4px] font-bold uppercase tracking-[0.08em] text-emerald-800">
                {t("statements.page.preview.ready")}
              </span>
            </div>
            <p className="mt-1 text-[6px] font-semibold leading-tight text-neutral-900">
              {t("statements.kind.annual_income_statement")}
            </p>
            <p className="text-[4.5px] text-neutral-500">{t("statements.period.year-2026")}</p>

            <div className="mt-1 overflow-hidden rounded-md bg-neutral-50">
              <div className="bg-neutral-900 px-1 py-0.5">
                <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-white/90">
                  {t("statements.preview.summaryTitle")}
                </p>
              </div>
              <div className="space-y-0.5 px-1 py-1 text-[4.5px]">
                <div className="flex justify-between text-neutral-600">
                  <span>{t("preview.megamenu.statements.summaryBalance")}</span>
                  <span className="font-mono font-semibold text-neutral-900">0,00 USDT</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>{t("preview.megamenu.statements.summaryInflow")}</span>
                  <span className="font-mono font-semibold text-emerald-700">+0,00</span>
                </div>
              </div>
            </div>

            <div className="preview-statements-steps mt-1 grid grid-cols-4 gap-px">
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={cn(
                    "flex size-3 items-center justify-center rounded-full text-[4px] font-bold",
                    "preview-statements-step bg-neutral-900 text-white",
                  )}
                  style={{ animationDelay: `${step * 80}ms` }}
                >
                  ✓
                </span>
              ))}
            </div>

            <button
              type="button"
              className="preview-statements-download relative mt-auto w-full rounded-md bg-neutral-900 py-1 text-[5px] font-semibold text-white"
            >
              {t("statements.preview.downloadPdf")}
              <BlockCursor
                step="statements-download"
                hint={t("preview.megamenu.statements.cursorDownload")}
                className="left-[55%] top-[40%]"
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function TrustScene() {
  const { t } = useI18n();
  const trustMetrics = [
    {
      label: t("preview.megamenu.trust.metricCurrencyLabel"),
      value: t("preview.megamenu.trust.metricCurrencyValue"),
    },
    {
      label: t("preview.megamenu.trust.metricLedgerLabel"),
      value: t("preview.megamenu.trust.metricLedgerValue"),
    },
    {
      label: t("preview.megamenu.trust.metricWithdrawLabel"),
      value: t("preview.megamenu.trust.metricWithdrawValue"),
    },
    {
      label: t("preview.megamenu.trust.metricStatusLabel"),
      value: t("preview.megamenu.trust.metricStatusValue"),
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f6f7f9]">
      <PageHero
        title={t("trust.hero.title")}
        eyebrow={t("trust.hero.eyebrow")}
        subtitle={t("trust.hero.subtitle")}
        src={PREVIEW_IMAGES.trustHero}
        heightClass="h-[32%] min-h-[46px]"
      />

      <div className="min-h-0 flex-1 space-y-1 overflow-hidden px-0.5 pt-0.5">
        <div className="grid grid-cols-2 gap-1">
          {trustMetrics.map((m) => (
            <div key={m.label} className="rounded-3xl bg-neutral-50/90 px-1.5 py-1">
              <p className="text-[5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{m.label}</p>
              <p className="mt-0.5 text-[6px] font-semibold text-neutral-900">{m.value}</p>
            </div>
          ))}
        </div>

        <section className="preview-trust-card relative rounded-3xl bg-white px-1.5 py-1.5 ring-1 ring-neutral-100/80">
          <p className="text-[6px] font-semibold text-neutral-900">{t("trust.pillars.title")}</p>
          <p className="text-[5px] text-neutral-500">{t("trust.pillars.subtitle")}</p>
          <div className="mt-1 flex gap-1 border-t border-neutral-100 pt-1">
            <div className="relative size-6 shrink-0">
              <Image src={PREVIEW_IMAGES.trustRiskIcon} alt="" fill sizes="28px" className="object-contain" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[6px] font-semibold text-neutral-900">{t("trust.section.risks.title")}</p>
              <div className="preview-trust-body mt-0.5">
                <p className="line-clamp-2 text-[5px] leading-snug text-neutral-700">{t("trust.section.risks.body")}</p>
              </div>
            </div>
          </div>
          <BlockCursor
            step="trust-card"
            hint={t("preview.megamenu.trust.cursorCard")}
            className="left-[52%] top-[48%]"
          />
        </section>
      </div>
    </div>
  );
}

function SceneContent({ href }: { href: string }) {
  switch (href) {
    case ROUTES.calculator:
      return <CalculatorScene />;
    case ROUTES.fees:
      return <FeesScene />;
    case ROUTES.systemStatus:
      return <StatusScene />;
    case ROUTES.news:
      return <NewsScene />;
    case ROUTES.referralProgram:
      return <ReferralScene />;
    case ROUTES.partnerProgram:
      return <PartnerScene />;
    case ROUTES.dashboardArtist:
      return <ArtistScene />;
    case ROUTES.dashboardDisputes:
      return <DisputesScene />;
    case ROUTES.dashboardStatements:
      return <StatementsScene />;
    case ROUTES.trust:
      return <TrustScene />;
    default:
      return null;
  }
}

export function ServicesMegamenuPagePreview({ href, label }: { href: string; label: string }) {
  const { t } = useI18n();
  const scene = SCENE_BY_HREF[href] ?? "calc";
  const dark =
    href === ROUTES.systemStatus ||
    href === ROUTES.referralProgram ||
    href === ROUTES.partnerProgram ||
    href === ROUTES.news;
  const chromeTitle = `${t("nav.misc")} · ${label}`;

  return (
    <MegamenuPreviewSceneShell key={href} title={chromeTitle} dark={dark} sceneClass={`service-preview-scene--${scene}`}>
      <ServicesPreviewFrame dark={dark}>
        <SceneContent href={href} />
      </ServicesPreviewFrame>
    </MegamenuPreviewSceneShell>
  );
}
