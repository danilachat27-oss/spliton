"use client";

import { Workflow } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import type { ReleaseDetailMechanicsBlock, ReleaseDetailPageData } from "@/types/analytics/release-detail";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import { cn } from "@/lib/utils";

import { DetailEmptyState } from "./detail-empty-state";
import { DetailSection } from "./detail-section";

function HowItWorksBlock({ heading, rows, body }: ReleaseDetailMechanicsBlock) {
  const hasRows = Boolean(rows?.length);

  return (
    <article className="min-h-[120px] rounded-xl bg-[#090909] px-4 py-4 ring-1 ring-white/6 md:min-h-[132px] md:px-5 md:py-5">
      <h3 className="text-sm font-semibold text-white">{heading}</h3>
      {hasRows ? (
        <dl
          className={cn(
            "mt-3.5 gap-2.5",
            rows!.length > 1 ? "grid sm:grid-cols-2 lg:grid-cols-3" : "space-y-0",
          )}
        >
          {rows!.map((row) => (
            <div
              key={row.label}
              className={cn(
                rows!.length > 1 && "rounded-lg bg-black/35 px-3 py-2.5",
                rows!.length === 1 && "flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4",
              )}
            >
              <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{row.label}</dt>
              <dd className="font-mono text-[15px] font-semibold leading-snug text-white sm:text-[16px]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : body ? (
        <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-400">{body}</p>
      ) : null}
    </article>
  );
}

export function ReleaseDetailHow({ data }: { data: ReleaseDetailPageData }) {
  const { locale } = useI18n();
  const eyebrow = detailPageText(locale, "analytics.detail.mechanics.eyebrow");
  const { blocks, title, description } = data.howItWorks;
  const isEmpty = blocks.length === 0;

  return (
    <DetailSection eyebrow={eyebrow} title={title} description={description}>
      {isEmpty ? (
        <div className="rounded-xl bg-[#090909] ring-1 ring-white/6">
          <DetailEmptyState
            icon={Workflow}
            title={detailPageText(locale, "analytics.detail.mechanics.emptyTitle")}
            body={detailPageText(locale, "analytics.detail.mechanics.empty")}
            imageSize="sm"
          />
        </div>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {blocks.map((block) => (
            <div key={block.heading} className={cn(blocks.length === 1 && "md:col-span-2")}>
              <HowItWorksBlock {...block} />
            </div>
          ))}
        </div>
      )}
    </DetailSection>
  );
}
