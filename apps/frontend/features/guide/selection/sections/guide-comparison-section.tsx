"use client";

import { GUIDE_COMPARISON_ROWS } from "@/constants/guide/selection";
import { useI18n } from "@/components/providers/i18n-provider";

import { GuideComparisonDemo } from "../ui/guide-comparison-demo";
import { GuideSectionShell } from "../ui/guide-section-shell";
import { GuideScrollReveal } from "../ui/guide-scroll-reveal";

export function GuideComparisonSection() {
  const { t } = useI18n();

  return (
    <GuideSectionShell
      id="compare"
      title={t("guide.comparison.title")}
      subtitle={t("guide.comparison.subtitle")}
    >
      <GuideScrollReveal purpose={t("guide.comparison.purposeHint")} rowCount={GUIDE_COMPARISON_ROWS.length}>
        <GuideComparisonDemo />
      </GuideScrollReveal>
    </GuideSectionShell>
  );
}
