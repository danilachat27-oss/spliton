import type { HelpCategoryPublic } from "@/services/help-center.service";

/** Slugs from `prisma/seed-help-center.ts` — stable labels via i18n. */
export const HELP_CENTER_KNOWN_CATEGORY_SLUGS = [
  "getting-started",
  "popular-questions",
  "account-security",
  "deposits-withdrawals",
  "buy-sell-shares",
  "secondary-market",
  "payouts",
  "docs",
] as const;

export type HelpCenterKnownCategorySlug = (typeof HELP_CENTER_KNOWN_CATEGORY_SLUGS)[number];

const KNOWN_SLUG_SET = new Set<string>(HELP_CENTER_KNOWN_CATEGORY_SLUGS);

const PLACEHOLDER_TITLES = new Set([
  "cat",
  "category",
  "categories",
  "draft cat",
  "live cat",
]);

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isPlaceholderHelpCategoryTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return true;
  if (PLACEHOLDER_TITLES.has(normalized)) return true;
  if (/^cat-\d+$/.test(normalized.replace(/\s+/g, "-"))) return true;
  return false;
}

/** E2E / admin test rows that should not appear on the public support hub. */
export function isJunkHelpCategory(category: HelpCategoryPublic): boolean {
  if (KNOWN_SLUG_SET.has(category.slug)) return false;

  if (/^(live-cat|draft-cat|cat-articles|cat)-\d{6,}/i.test(category.slug)) return true;
  if (/^(live-cat|draft-cat|cat-articles)-/i.test(category.slug)) return true;

  return isPlaceholderHelpCategoryTitle(category.title);
}

export function resolveHelpCategoryTitle(
  category: HelpCategoryPublic,
  t: (key: string) => string,
): string {
  const i18nKey = `support.categories.${category.slug}.title`;
  const localized = t(i18nKey);
  if (localized && localized !== i18nKey) return localized;

  if (!isPlaceholderHelpCategoryTitle(category.title)) return category.title;
  return humanizeSlug(category.slug);
}

export function resolveHelpCategoryDescription(
  category: HelpCategoryPublic,
  t: (key: string) => string,
): string {
  const i18nKey = `support.categories.${category.slug}.description`;
  const localized = t(i18nKey);
  if (localized && localized !== i18nKey) return localized;
  return category.description;
}

export function filterPublicHelpCategories(categories: HelpCategoryPublic[]): HelpCategoryPublic[] {
  const seen = new Set<string>();
  const result: HelpCategoryPublic[] = [];

  for (const category of categories) {
    if (isJunkHelpCategory(category)) continue;
    if (seen.has(category.slug)) continue;
    seen.add(category.slug);
    result.push(category);
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
}
