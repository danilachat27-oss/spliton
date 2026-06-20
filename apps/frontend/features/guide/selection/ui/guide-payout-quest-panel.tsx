"use client";

import { ArrowLeft } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

import "./guide-payout-quest.css";
import "./guide-payout-terminal.css";

export const PAYOUT_QUEST_STEPS = ["regularity", "accrued", "yield"] as const;

export type PayoutQuestStepId = (typeof PAYOUT_QUEST_STEPS)[number];

type GuidePayoutQuestPanelProps = {
  activeStep: PayoutQuestStepId;
  paused: boolean;
  onStepSelect: (step: PayoutQuestStepId) => void;
  onPauseChange: (paused: boolean) => void;
};

export function GuidePayoutQuestPanel({
  activeStep,
  paused,
  onStepSelect,
  onPauseChange,
}: GuidePayoutQuestPanelProps) {
  const { t } = useI18n();

  return (
    <div
      className="guide-payout-quest guide-payout-quest-terminal"
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
      onFocus={() => onPauseChange(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onPauseChange(false);
        }
      }}
    >
      <div className="guide-payout-quest-header">{t("guide.payouts.quest.title")}</div>

      <div className="guide-payout-quest-track" role="list">
        {PAYOUT_QUEST_STEPS.map((stepId, index) => {
          const isActive = activeStep === stepId;

          return (
            <button
              key={stepId}
              type="button"
              role="listitem"
              aria-current={isActive ? "step" : undefined}
              onClick={() => onStepSelect(stepId)}
              className={cn(
                "guide-payout-quest-step w-full",
                isActive && "is-active",
                isActive && paused && "is-paused",
              )}
            >
              <span className="guide-payout-quest-marker">
                <span className="guide-payout-quest-dot">{index + 1}</span>
              </span>

              <span className="guide-payout-quest-body">
                <span className="guide-payout-quest-title">{t(`guide.payouts.quest.step.${stepId}.title`)}</span>
                <p className="guide-payout-quest-text">{t(`guide.payouts.quest.step.${stepId}.body`)}</p>

                <span className="guide-payout-quest-pointer" aria-hidden={!isActive}>
                  <ArrowLeft className="size-3 shrink-0" strokeWidth={2} />
                  {t(`guide.payouts.quest.step.${stepId}.pointer`)}
                </span>

                <span className="guide-payout-quest-progress" aria-hidden={!isActive}>
                  {isActive ? (
                    <span
                      key={`${stepId}-progress`}
                      className="guide-payout-quest-progress-bar"
                    />
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
