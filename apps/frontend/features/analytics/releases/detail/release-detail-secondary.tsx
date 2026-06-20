"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_DETAIL_ANALYTICS_ICONS } from "@/constants/analytics/release-detail-analytics-icons";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";
import { filterMetricRows } from "@/lib/analytics/display-value";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import { cn } from "@/lib/utils";

import { DetailSection } from "./detail-section";
import { DetailEmptyState } from "./detail-empty-state";

export function ReleaseDetailSecondary({
  data,
  className,
  sectionTitleClassName,
}: {
  data: ReleaseDetailPageData;
  className?: string;
  sectionTitleClassName?: string;
}) {
  const { locale } = useI18n();
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);
  const rows = filterMetricRows(data.secondary.rows);
  const secondaryEnabled = data.pageState.secondaryEnabled;
  const marketHref = data.secondary.marketHref;

  if (rows.length === 0) {
    return (
      <DetailSection
        className={cn(className)}
        eyebrow={t("analytics.detail.secondary.eyebrow")}
        title={data.secondary.title}
        titleClassName={sectionTitleClassName}
        description={t("analytics.detail.secondary.description")}
      >
        <div className="overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/6">
          <DetailEmptyState
            imageSrc={RELEASE_DETAIL_ANALYTICS_ICONS.secondaryEmpty}
            title={
              secondaryEnabled
                ? t("analytics.detail.secondary.emptyStatus")
                : t("analytics.detail.secondary.unavailable")
            }
            body={secondaryEnabled ? t("analytics.detail.secondary.emptyHint") : t("analytics.detail.secondary.description")}
            action={
              marketHref ? (
                <Link
                  href={marketHref}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[13px] font-semibold text-black transition hover:opacity-90"
                >
                  {t("analytics.detail.secondary.openMarket")}
                </Link>
              ) : undefined
            }
          />
        </div>
      </DetailSection>
    );
  }

  return (
    <DetailSection
      className={cn(className)}
      eyebrow={t("analytics.detail.secondary.eyebrow")}
      title={data.secondary.title}
      titleClassName={sectionTitleClassName}
      description={t("analytics.detail.secondary.description")}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-[#111111] px-4 py-3 transition-colors hover:bg-white/[0.04]"
          >
            <span className="text-[12px] text-zinc-500">{r.label}</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-white">{r.value}</span>
          </div>
        ))}
      </div>
      {marketHref ? (
        <p className="mt-4">
          <Link
            href={marketHref}
            className="text-sm font-medium text-zinc-300 underline hover:text-white"
          >
            {t("analytics.detail.secondary.openMarket")}
          </Link>
        </p>
      ) : null}
    </DetailSection>
  );
}
