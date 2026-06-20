"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";

import { DetailSection } from "./detail-section";

export function ReleaseDetailAbout({ data }: { data: ReleaseDetailPageData }) {
  const { locale } = useI18n();
  const eyebrow = detailPageText(locale, "analytics.detail.about.eyebrow");

  if (data.about.paragraphs.length === 0) return null;

  return (
    <DetailSection className="mt-10 pt-0 md:mt-12" eyebrow={eyebrow} title={data.about.title}>
      <div className="max-w-[72ch] space-y-4 text-sm leading-relaxed text-zinc-400">
        {data.about.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </DetailSection>
  );
}
