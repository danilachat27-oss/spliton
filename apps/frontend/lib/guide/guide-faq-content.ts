import { guideText } from "@/lib/i18n/guide-messages";
import type { AppLocale } from "@/lib/i18n/types";

export type GuideFaqCategoryId = "general" | "yield" | "deal" | "liquidity";

export type GuideFaqFilterId = "all" | GuideFaqCategoryId;

export const GUIDE_FAQ_CATEGORY_ORDER: GuideFaqCategoryId[] = ["general", "yield", "deal", "liquidity"];

export const GUIDE_FAQ_ITEM_IDS = [
  { id: "what-is-unit", category: "general" as const },
  { id: "where-payout-history", category: "yield" as const },
  { id: "holder-share", category: "deal" as const },
  { id: "what-is-secondary", category: "liquidity" as const },
  { id: "why-payouts-vary", category: "yield" as const },
  { id: "yield-vs-stability", category: "yield" as const },
  { id: "early-exit", category: "liquidity" as const },
  { id: "aggressive-deal", category: "deal" as const },
  { id: "newbie-checklist", category: "general" as const },
  { id: "why-liquidity", category: "liquidity" as const },
  { id: "what-is-accrued", category: "yield" as const },
  { id: "what-is-released", category: "yield" as const },
  { id: "where-risks", category: "general" as const },
] as const;

export type GuideFaqItemId = (typeof GUIDE_FAQ_ITEM_IDS)[number]["id"];

export type GuideFaqItem = {
  id: GuideFaqItemId;
  category: GuideFaqCategoryId;
  categoryLabel: string;
  q: string;
  a: string;
};

export type GuideFaqGroup = {
  category: GuideFaqCategoryId;
  label: string;
  items: GuideFaqItem[];
};

export function guideFaqCategoryLabel(locale: AppLocale, category: GuideFaqCategoryId): string {
  return guideText(locale, `guide.faq.category.${category}`);
}

export function buildGuideFaqItems(locale: AppLocale): GuideFaqItem[] {
  return GUIDE_FAQ_ITEM_IDS.map(({ id, category }) => ({
    id,
    category,
    categoryLabel: guideFaqCategoryLabel(locale, category),
    q: guideText(locale, `guide.faq.${id}.q`),
    a: guideText(locale, `guide.faq.${id}.a`),
  }));
}

export function buildGuideFaqGroups(locale: AppLocale, filter: GuideFaqFilterId): GuideFaqGroup[] {
  const items = buildGuideFaqItems(locale);
  const categories = filter === "all" ? GUIDE_FAQ_CATEGORY_ORDER : [filter];

  return categories
    .map((category) => ({
      category,
      label: guideFaqCategoryLabel(locale, category),
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
}

export function guideFaqFilterOptions(locale: AppLocale): { id: GuideFaqFilterId; label: string }[] {
  return [
    { id: "all", label: guideText(locale, "guide.faq.filter.all") },
    ...GUIDE_FAQ_CATEGORY_ORDER.map((category) => ({
      id: category as GuideFaqFilterId,
      label: guideFaqCategoryLabel(locale, category),
    })),
  ];
}
