"use client";

import { Minus, Plus } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";

import { ReleaseSectionShell } from "./ui/release-section-shell";

const FAQ_ITEM_COUNT = 6;

export function ReleaseParametersFaq() {
  const { t } = useI18n();

  return (
    <ReleaseSectionShell
      id="rp-faq"
      title={t("catalog.releaseParameters.faq.title")}
      subtitle={t("catalog.releaseParameters.faq.subtitle")}
      headerAlign="left"
    >
      <div className="space-y-2">
        {Array.from({ length: FAQ_ITEM_COUNT }, (_, i) => i + 1).map((n) => {
          const question = t(`catalog.releaseParameters.faq.item${n}.question`);
          return (
            <details
              key={question}
              className="group overflow-hidden rounded-xl bg-[#111111] [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-white/4 md:px-4 md:py-3.5">
                <span className="min-w-0 flex-1 text-left text-[15px] font-medium leading-snug text-white md:text-base">
                  {question}
                </span>
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-white transition-colors group-open:bg-[#B7F500]/14 group-open:text-[#d4f570]"
                  aria-hidden
                >
                  <Plus className="size-4 group-open:hidden" strokeWidth={1.75} />
                  <Minus className="hidden size-4 group-open:block" strokeWidth={1.75} />
                </span>
              </summary>
              <div className="border-t border-white/6 bg-[#0a0a0a] px-3 pb-3.5 pt-3 text-sm leading-relaxed text-zinc-300 md:px-4 md:pb-4 md:pt-3.5 md:text-[15px]">
                {t(`catalog.releaseParameters.faq.item${n}.answer`)}
              </div>
            </details>
          );
        })}
      </div>
    </ReleaseSectionShell>
  );
}
