import { resolveServerLocale } from "@/lib/i18n/server-locale";
import type { AppLocale } from "@/lib/i18n/types";
import { isLiveHelpCenterEnabled, resolveApiUrl } from "@/lib/public-env";

/** Align with backend public help categories cache TTL. */
export const HELP_CENTER_REVALIDATE_SECONDS = 60;

type HelpArticleMeta = {
  title: string;
  excerpt: string;
  metaTitle: string | null;
  metaDescription: string | null;
};

type HelpCategoryMeta = {
  title: string;
  description: string;
};

async function helpServerFetch<T>(path: string, locale: AppLocale): Promise<T | null> {
  const separator = path.includes("?") ? "&" : "?";
  const url = resolveApiUrl(`${path}${separator}locale=${locale}`);
  const res = await fetch(url, { next: { revalidate: HELP_CENTER_REVALIDATE_SECONDS } });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function fetchHelpArticleMetaForSeo(
  slug: string,
  locale?: AppLocale,
): Promise<HelpArticleMeta | null> {
  if (!isLiveHelpCenterEnabled()) return null;
  const loc = locale ?? (await resolveServerLocale());
  const data = await helpServerFetch<{ article: HelpArticleMeta }>(
    `/api/v1/help/articles/${encodeURIComponent(slug)}`,
    loc,
  );
  return data?.article ?? null;
}

export async function fetchHelpCategoryMetaForSeo(
  slug: string,
  locale?: AppLocale,
): Promise<HelpCategoryMeta | null> {
  if (!isLiveHelpCenterEnabled()) return null;
  const loc = locale ?? (await resolveServerLocale());
  const data = await helpServerFetch<{ category: HelpCategoryMeta }>(
    `/api/v1/help/categories/${encodeURIComponent(slug)}`,
    loc,
  );
  return data?.category ?? null;
}
