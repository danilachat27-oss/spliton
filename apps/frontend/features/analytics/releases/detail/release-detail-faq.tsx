"use client";

import * as React from "react";
import { ChevronDown } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";

import { cn } from "@/lib/utils";

import { DetailSection } from "./detail-section";

export function ReleaseDetailFaq({ data }: { data: ReleaseDetailPageData }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState<number | null>(0);

  if (data.faq.length === 0) {
    return null;
  }

  return (
    <DetailSection eyebrow="FAQ" title={t("analytics.detail.faq.title")}>
      <div className="space-y-2">
        {data.faq.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="overflow-hidden rounded-xl bg-[#111111]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span className="text-sm font-medium text-white">{item.q}</span>
                <ChevronDown
                  className={cn("mt-0.5 size-4 shrink-0 text-zinc-500 transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <p className="bg-[#0a0a0a] px-4 pb-4 pt-1 text-[13px] leading-relaxed text-zinc-500">{item.a}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </DetailSection>
  );
}
