"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import {
  analyticsHeroBackLabel,
} from "@/lib/i18n/analytics-messages";
import { cn } from "@/lib/utils";
import type { ReleaseRowGenre } from "@/types/analytics/releases";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";

import { ReleaseDetailBreadcrumb } from "./release-detail-breadcrumb";
import { ReleaseDetailCover } from "./release-detail-cover";
import { ReleaseDetailHeroCta, ReleaseDetailLifecycleBadge } from "./release-detail-hero-cta";

function genreLabelKey(genre: ReleaseRowGenre): Parameters<typeof detailPageText>[1] {
  if (genre === "hiphop") return "analytics.detail.genre.hiphop";
  if (genre === "pop") return "analytics.detail.genre.pop";
  return "analytics.detail.genre.electronic";
}

export function ReleaseDetailHero({
  data,
  source,
  backHrefOverride,
  backLabelOverride,
}: {
  data: ReleaseDetailPageData;
  source?: string;
  backHrefOverride?: string;
  backLabelOverride?: string;
}) {
  const { locale, t } = useI18n();
  const { row } = data;
  const backHrefDefault =
    source === "catalog"
      ? ROUTES.dashboardCatalog
      : source === "secondary"
        ? ROUTES.dashboardSecondaryMarket
        : ROUTES.analyticsReleases;
  const backHref = backHrefOverride ?? backHrefDefault;
  const backLabel =
    backLabelOverride ??
    analyticsHeroBackLabel(source, locale);
  const artist = row.artist?.trim();

  return (
    <header className="pb-6 sm:pb-10">
      <Link
        href={backHref}
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2",
          "text-[11px] font-medium text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/[0.07] hover:text-zinc-200",
          "sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-[12px]",
        )}
      >
        <ChevronLeft className="size-4 shrink-0 sm:hidden" strokeWidth={2} aria-hidden />
        <span className="truncate">{backLabel}</span>
        <ChevronRight className="hidden size-3.5 shrink-0 sm:block" strokeWidth={1.8} aria-hidden />
        <span className="shrink-0 font-mono text-[12px] font-semibold text-white sm:text-[13px]">{row.symbol}</span>
      </Link>

      <div className="mt-3 hidden sm:mt-5 sm:block">
        <ReleaseDetailBreadcrumb data={data} />
      </div>

      <div className="mt-4 min-w-0 sm:mt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600 sm:text-[11px] sm:tracking-[0.22em] sm:text-zinc-500">
          {t("analytics.detail.hero.eyebrow")}
        </p>
        <h1 className="mt-2 text-balance text-[1.65rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-3xl sm:leading-tight lg:text-4xl">
          {row.release}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-3.5 sm:gap-2">
          {artist ? (
            <span className="max-w-full truncate text-[13px] text-zinc-300 sm:text-sm">{artist}</span>
          ) : null}
          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-400 ring-1 ring-white/8 sm:text-[11px]">
            {row.symbol}
          </span>
          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-white/8 sm:text-[11px]">
            {detailPageText(locale, genreLabelKey(row.genre))}
          </span>
          <ReleaseDetailLifecycleBadge data={data} />
        </div>

        <p className="mt-3 max-w-[62ch] text-[13px] leading-relaxed text-zinc-500 sm:mt-4 sm:text-sm sm:text-zinc-400">
          {data.heroBlurb}
        </p>

        <ReleaseDetailHeroCta data={data} />

        <ReleaseDetailCover cover={data.cover} releaseTitle={row.release} compact={!data.cover?.videoSrc && !data.cover?.posterSrc} />
      </div>
    </header>
  );
}
