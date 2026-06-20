"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_PARAMETERS_FIRST_LOOK } from "@/constants/release-parameters/page";

import { ReleaseSectionShell } from "./ui/release-section-shell";

export function ReleaseParametersPriority() {
  const { t } = useI18n();
  const lastIndex = RELEASE_PARAMETERS_FIRST_LOOK.length - 1;

  return (
    <ReleaseSectionShell
      id="rp-first"
      title={t("catalog.releaseParameters.priority.title")}
      subtitle={t("catalog.releaseParameters.priority.subtitle")}
    >
      <div className="guide-panel px-4 py-4 sm:px-5 sm:py-5">
        <ol className="space-y-0">
          {RELEASE_PARAMETERS_FIRST_LOOK.map((_, idx) => (
            <li key={idx} className="flex gap-3 sm:gap-4">
              <div className="flex w-7 shrink-0 flex-col items-center sm:w-8">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#B7F500]/35 bg-[#B7F500]/8 font-mono text-[10px] font-semibold tabular-nums text-[#c4f570] sm:size-8 sm:text-[11px]">
                  {idx + 1}
                </div>
                {idx < lastIndex ? (
                  <div
                    className="mt-2 min-h-8 w-px flex-1 bg-gradient-to-b from-[#B7F500]/30 to-white/8 sm:min-h-10"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={`min-w-0 flex-1 pt-0.5 ${idx < lastIndex ? "pb-5 sm:pb-6" : ""}`}>
                <h3 className="text-[15px] font-semibold text-white sm:text-base">
                  {t(`catalog.releaseParameters.priority.item${idx + 1}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {t(`catalog.releaseParameters.priority.item${idx + 1}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </ReleaseSectionShell>
  );
}
