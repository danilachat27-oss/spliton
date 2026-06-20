"use client";

import { GUIDE_TOPIC_CARDS } from "@/constants/guide/selection";
import { useI18n } from "@/components/providers/i18n-provider";

import { GuideSectionHeader } from "../ui/guide-section-header";
import { GuideExchangeCard } from "../ui/guide-exchange-card";

export function GuideTopicGridSection() {
  const { t } = useI18n();

  return (
    <section id="topics" data-guide-section className="scroll-mt-24">
      <GuideSectionHeader title={t("guide.topics.title")} align="center" />
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {GUIDE_TOPIC_CARDS.map((card) => (
          <GuideExchangeCard
            key={card.anchor}
            href={"href" in card && card.href ? card.href : `#${card.anchor}`}
            icon={card.icon}
            title={t(card.titleKey)}
            description={t(card.descKey)}
          />
        ))}
      </div>
    </section>
  );
}
