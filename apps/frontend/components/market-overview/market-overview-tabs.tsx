"use client";

import { UnderlineTab } from "@/components/shared/exchange/underline-tab";
import { useI18n } from "@/components/providers/i18n-provider";
import { MARKET_CATEGORY_TABS } from "@/constants/market-overview/page";
import type { MarketOverviewCategory } from "@/types/market-overview";

export function MarketOverviewTabs({
  value,
  onChange,
}: {
  value: MarketOverviewCategory;
  onChange: (v: MarketOverviewCategory) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-10 w-full items-center gap-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {MARKET_CATEGORY_TABS.map((tab) => (
        <UnderlineTab key={tab.id} tone="neutral" active={value === tab.id} onClick={() => onChange(tab.id)}>
          {t(`marketOverview.tab.${tab.id}`)}
        </UnderlineTab>
      ))}
    </div>
  );
}
