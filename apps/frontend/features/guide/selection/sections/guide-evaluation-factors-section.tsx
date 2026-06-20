"use client";

import { GUIDE_FACTOR_IDS } from "@/constants/guide/selection";
import { useI18n } from "@/components/providers/i18n-provider";

import { GuideSectionShell } from "../ui/guide-section-shell";
import { GuideScrollReveal, guideRevealRowStyle } from "../ui/guide-scroll-reveal";

export function GuideEvaluationFactorsSection() {
  const { t } = useI18n();
  const lastIndex = GUIDE_FACTOR_IDS.length - 1;

  return (
    <GuideSectionShell
      id="factors"
      title={t("guide.factors.title")}
      subtitle={t("guide.factors.subtitle")}
    >
      <GuideScrollReveal purpose={t("guide.factors.purposeHint")} rowCount={GUIDE_FACTOR_IDS.length}>
        <ol className="guide-panel px-4 py-4 sm:px-5 sm:py-5">
          {GUIDE_FACTOR_IDS.map((factorId, index) => (
            <li
              key={factorId}
              style={guideRevealRowStyle(index)}
              className={`guide-reveal-row flex gap-3 sm:gap-4 ${index > 0 ? "mt-0" : ""}`}
            >
              <div className="flex w-7 shrink-0 flex-col items-center sm:w-8">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#B7F500]/35 bg-[#B7F500]/8 font-mono text-[10px] font-semibold tabular-nums text-[#c4f570] shadow-[0_0_8px_rgba(183,245,0,0.12)] sm:size-8 sm:text-[11px]">
                  {index + 1}
                </div>
                {index < lastIndex ? (
                  <div
                    className="mt-2 min-h-8 w-px flex-1 bg-gradient-to-b from-[#B7F500]/30 to-white/8 sm:min-h-10"
                    aria-hidden
                  />
                ) : null}
              </div>

              <div className={`min-w-0 flex-1 pt-0.5 ${index < lastIndex ? "pb-5 sm:pb-6" : ""}`}>
                <h3 className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
                  {t(`guide.factors.${factorId}.title`)}
                </h3>
                <dl className="mt-2.5 space-y-2 text-sm">
                  <div>
                    <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      {t("guide.factors.label.essence")}
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-zinc-300">{t(`guide.factors.${factorId}.essence`)}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      {t("guide.factors.label.watch")}
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-zinc-400">{t(`guide.factors.${factorId}.watch`)}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      {t("guide.factors.label.why")}
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-zinc-500">{t(`guide.factors.${factorId}.why`)}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </GuideScrollReveal>
    </GuideSectionShell>
  );
}
