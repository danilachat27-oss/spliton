"use client";

import { GUIDE_RISK_ITEM_IDS } from "@/constants/guide/selection";
import { useI18n } from "@/components/providers/i18n-provider";

import { GuideSectionShell } from "../ui/guide-section-shell";
import { GuideScrollReveal, guideRevealRowStyle } from "../ui/guide-scroll-reveal";

export function GuideRisksSection() {
  const { t } = useI18n();
  const lastIndex = GUIDE_RISK_ITEM_IDS.length - 1;

  return (
    <GuideSectionShell
      id="risks"
      title={t("guide.risks.title")}
      subtitle={t("guide.risks.subtitle")}
    >
      <GuideScrollReveal purpose={t("guide.risks.purposeHint")} rowCount={GUIDE_RISK_ITEM_IDS.length}>
        <div className="guide-panel px-4 py-4 sm:px-5 sm:py-5">
          <ol className="space-y-0">
            {GUIDE_RISK_ITEM_IDS.map((itemId, index) => (
              <li
                key={itemId}
                style={guideRevealRowStyle(index)}
                className={`guide-reveal-row flex gap-3 sm:gap-4 ${index > 0 ? "" : ""}`}
              >
                <div className="flex w-7 shrink-0 flex-col items-center sm:w-8">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/10 font-mono text-[10px] font-semibold tabular-nums text-amber-200/90 sm:size-8 sm:text-[11px]">
                    {index + 1}
                  </div>
                  {index < lastIndex ? (
                    <div
                      className="mt-2 min-h-8 w-px flex-1 bg-gradient-to-b from-amber-500/25 to-white/8 sm:min-h-10"
                      aria-hidden
                    />
                  ) : null}
                </div>

                <div className={`min-w-0 flex-1 pt-0.5 ${index < lastIndex ? "pb-5 sm:pb-6" : ""}`}>
                  <h3 className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
                    {t(`guide.risks.item.${itemId}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                    {t(`guide.risks.item.${itemId}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="guide-reveal-footer mt-4 border-t border-white/6 pt-4 text-[12px] leading-relaxed text-zinc-500 sm:text-[13px]">
            {t("guide.risks.footer")}
          </p>
        </div>
      </GuideScrollReveal>
    </GuideSectionShell>
  );
}
