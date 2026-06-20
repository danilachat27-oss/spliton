"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { GuideSectionShell } from "../ui/guide-section-shell";
import { GuideScrollReveal, guideRevealBlockStyle } from "../ui/guide-scroll-reveal";

const STEPS = [
  "guide.deal.step.raiseTarget",
  "guide.deal.step.untDistribution",
  "guide.deal.step.investorShare",
  "guide.deal.step.platformFee",
  "guide.deal.step.netPayout",
] as const;

const CONTEXT = [
  { titleKey: "guide.deal.context.split.title", bodyKey: "guide.deal.context.split.body" },
  { titleKey: "guide.deal.context.fees.title", bodyKey: "guide.deal.context.fees.body" },
  { titleKey: "guide.deal.context.performance.title", bodyKey: "guide.deal.context.performance.body" },
] as const;

export function GuideDealStructureSection() {
  const { t } = useI18n();
  const lastStep = STEPS.length - 1;

  return (
    <GuideSectionShell
      id="deal"
      title={t("guide.deal.title")}
      subtitle={t("guide.deal.subtitle")}
    >
      <GuideScrollReveal purpose={t("guide.deal.purposeHint")}>
        <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
          <div
            style={guideRevealBlockStyle(0)}
            className="guide-reveal-block guide-panel p-4 sm:p-5"
          >
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {t("guide.deal.stepsLabel")}
            </div>
            <ol className="mt-4 space-y-0">
              {STEPS.map((stepKey, i) => (
                <li key={stepKey} className="flex gap-3 sm:gap-4">
                  <div className="flex w-7 shrink-0 flex-col items-center sm:w-8">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px] font-semibold tabular-nums text-zinc-200 sm:size-8 sm:text-[11px]">
                      {i + 1}
                    </div>
                    {i < lastStep ? <div className="mt-2 w-px flex-1 min-h-5 bg-zinc-800 sm:min-h-6" aria-hidden /> : null}
                  </div>
                  <div className={`min-w-0 flex-1 pt-0.5 ${i < lastStep ? "pb-3 sm:pb-4" : ""}`}>
                    <div className="text-sm font-semibold text-white">{t(stepKey)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div
            style={guideRevealBlockStyle(1)}
            className="guide-reveal-block guide-panel px-4 py-4 sm:px-5 sm:py-5"
          >
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {t("guide.deal.contextLabel")}
            </div>
            <div className="mt-3 space-y-4">
              {CONTEXT.map(({ titleKey, bodyKey }) => (
                <div key={titleKey}>
                  <div className="text-sm font-semibold text-white">{t(titleKey)}</div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t(bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GuideScrollReveal>
    </GuideSectionShell>
  );
}
