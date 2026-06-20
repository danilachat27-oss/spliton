"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";
import { filterTermRows, isEmptyDisplayValue } from "@/lib/analytics/display-value";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";

import { DetailSection } from "./detail-section";

export function ReleaseDetailTerms({ data }: { data: ReleaseDetailPageData }) {
  const { locale } = useI18n();
  const eyebrow = detailPageText(locale, "analytics.detail.terms.eyebrow");
  const rows = filterTermRows(data.terms.rows);
  if (rows.length === 0) return null;

  return (
    <DetailSection eyebrow={eyebrow} title={data.terms.title}>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <article
            key={r.key}
            className="rounded-xl bg-[#090909] px-4 py-3.5 transition-colors hover:bg-[#101010]"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{r.key}</p>
            <p className="mt-1.5 font-mono text-[18px] font-semibold leading-tight text-white">{r.val}</p>
            {!isEmptyDisplayValue(r.note) ? (
              <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{r.note}</p>
            ) : null}
          </article>
        ))}
      </div>
    </DetailSection>
  );
}
