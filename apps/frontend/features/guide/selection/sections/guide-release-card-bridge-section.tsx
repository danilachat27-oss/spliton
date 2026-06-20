"use client";

import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";
import { useState } from "react";

import { GUIDE_CATALOG_HREF, GUIDE_RELEASE_CARD_STEP_IDS, type GuideReleaseCardStepId } from "@/constants/guide/selection";
import { useI18n } from "@/components/providers/i18n-provider";

import { GuideSectionShell } from "../ui/guide-section-shell";
import { GuideReleaseCardDemo, GuideReleaseCardSteps } from "../ui/guide-release-card-demo";

export function GuideReleaseCardBridgeSection() {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState<GuideReleaseCardStepId>(GUIDE_RELEASE_CARD_STEP_IDS[0]);

  return (
    <GuideSectionShell
      id="release-card"
      title={t("guide.releaseCard.title")}
      subtitle={t("guide.releaseCard.subtitle")}
    >
      <div className="guide-release-card-layout">
        <div className="guide-release-card-col">
          <GuideReleaseCardDemo activeStep={activeStep} />
        </div>
        <div className="guide-release-card-col">
          <GuideReleaseCardSteps activeStep={activeStep} onStepSelect={setActiveStep} />
        </div>
      </div>
      <div className="mt-5 text-center">
        <Link
          href={GUIDE_CATALOG_HREF}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-300 underline decoration-white/20 underline-offset-[3px] transition hover:text-white hover:decoration-white/40"
        >
          {t("guide.releaseCard.cta")}
          <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </GuideSectionShell>
  );
}
