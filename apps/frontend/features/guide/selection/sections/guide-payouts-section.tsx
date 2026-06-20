"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";

import { GuideSectionShell } from "../ui/guide-section-shell";
import {
  GuidePayoutQuestPanel,
  PAYOUT_QUEST_STEPS,
  type PayoutQuestStepId,
} from "../ui/guide-payout-quest-panel";
import { GuideScrollReveal, guideRevealBlockStyle } from "../ui/guide-scroll-reveal";
import { GuidePayoutTerminal, buildPayoutTerminalSeries } from "../ui/guide-payout-terminal";

const QUEST_CYCLE_MS = 4500;

export function GuidePayoutsSection() {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState<PayoutQuestStepId>("regularity");
  const [paused, setPaused] = useState(false);

  const series = useMemo(() => buildPayoutTerminalSeries(t), [t]);

  const advanceStep = useCallback(() => {
    setActiveStep((prev) => {
      const index = PAYOUT_QUEST_STEPS.indexOf(prev);
      return PAYOUT_QUEST_STEPS[(index + 1) % PAYOUT_QUEST_STEPS.length];
    });
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(advanceStep, QUEST_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [advanceStep, paused]);

  const handleStepSelect = useCallback((step: PayoutQuestStepId) => {
    setActiveStep(step);
    setPaused(true);
  }, []);

  return (
    <GuideSectionShell
      id="payouts"
      title={t("guide.payouts.title")}
      subtitle={t("guide.payouts.subtitle")}
    >
      <GuideScrollReveal purpose={t("guide.payouts.purposeHint")} className="guide-payout-reveal">
        <div className="guide-payout-split">
          <div
            style={guideRevealBlockStyle(0)}
            className="guide-payout-split-col guide-reveal-block guide-payout-example"
            data-focus={activeStep}
          >
            <GuidePayoutTerminal series={series} />
          </div>

          <div style={guideRevealBlockStyle(1)} className="guide-payout-split-col guide-reveal-block">
            <GuidePayoutQuestPanel
              activeStep={activeStep}
              paused={paused}
              onStepSelect={handleStepSelect}
              onPauseChange={setPaused}
            />
          </div>
        </div>
      </GuideScrollReveal>
    </GuideSectionShell>
  );
}
