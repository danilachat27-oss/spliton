"use client";

import { PayoutsSubpageHero } from "@/components/dashboard/assets/payouts-subpage-hero";
import { useI18n } from "@/components/providers/i18n-provider";

type LocalizedSubpageHeroProps = {
  eyebrow?: string;
  eyebrowKey?: string;
  titleKey: string;
  descriptionKey?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
};

export function LocalizedSubpageHero({ eyebrow, eyebrowKey, titleKey, descriptionKey, align, tone }: LocalizedSubpageHeroProps) {
  const { t } = useI18n();

  return (
    <PayoutsSubpageHero
      eyebrow={eyebrowKey ? t(eyebrowKey) : (eyebrow ?? "")}
      title={t(titleKey)}
      description={descriptionKey ? t(descriptionKey) : undefined}
      align={align}
      tone={tone}
    />
  );
}
