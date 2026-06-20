"use client";

import { GUIDE_CHECKLIST_STEP_IDS } from "@/constants/guide/selection";
import { useI18n } from "@/components/providers/i18n-provider";

import { GuideSectionShell } from "../ui/guide-section-shell";

export function GuideChecklistSection() {
  const { t } = useI18n();
  const lastIndex = GUIDE_CHECKLIST_STEP_IDS.length - 1;

  return (
    <GuideSectionShell
      id="checklist"
      title={t("guide.checklist.title")}
      subtitle={t("guide.checklist.subtitle")}
    >
      <div className="guide-panel px-4 py-4 sm:px-5 sm:py-5">
        <ol className="space-y-0">
          {GUIDE_CHECKLIST_STEP_IDS.map((stepId, index) => (
            <li key={stepId} className="flex gap-3 sm:gap-4">
              <div className="flex w-7 shrink-0 flex-col items-center sm:w-8">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#B7F500]/35 bg-[#B7F500]/8 font-mono text-[10px] font-semibold tabular-nums text-[#c4f570] shadow-[0_0_8px_rgba(183,245,0,0.12)] sm:size-8 sm:text-[11px]">
                  {index + 1}
                </div>
                {index < lastIndex ? (
                  <div
                    className="mt-2 min-h-5 w-px flex-1 bg-gradient-to-b from-[#B7F500]/30 to-white/8 sm:min-h-6"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={`min-w-0 flex-1 pt-0.5 ${index < lastIndex ? "pb-3 sm:pb-4" : ""}`}>
                <p className="text-sm leading-relaxed text-white sm:text-[15px]">
                  {t(`guide.checklist.step.${stepId}`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-white/6 pt-4 text-[12px] leading-relaxed text-zinc-400 sm:text-[13px]">
          {t("guide.checklist.videoNote")}
        </p>
      </div>
    </GuideSectionShell>
  );
}
