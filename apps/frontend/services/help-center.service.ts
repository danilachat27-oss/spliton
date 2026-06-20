import { ApiClientError, parseApiClientError } from "@/lib/api/api-client-error";
import { isLiveHelpCenterEnabled, resolveApiUrl } from "@/lib/public-env";
import type { AppLocale } from "@/lib/i18n/types";

export type HelpCategoryPublic = {
  id: string;
  slug: string;
  parentId: string | null;
  title: string;
  description: string;
  icon: string | null;
  sortOrder: number;
  children?: HelpCategoryPublic[];
};

export type HelpArticleSummary = {
  id: string;
  slug: string;
  categoryId: string | null;
  title: string;
  excerpt: string;
  sortOrder: number;
  isFeatured: boolean;
  isPopular: boolean;
  isGettingStarted: boolean;
  viewCount: number;
  publishedAt: string | null;
};

export type HelpArticleDetail = HelpArticleSummary & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  category: HelpCategoryPublic | null;
  breadcrumbs: Array<{ slug: string; title: string }>;
};

type CategoriesResponse = {
  locale: AppLocale;
  items: HelpCategoryPublic[];
  tree: HelpCategoryPublic[];
};

type ArticlesResponse = {
  locale: AppLocale;
  items: HelpArticleSummary[];
  total: number;
  limit: number;
};

type CategoryDetailResponse = {
  locale: AppLocale;
  category: HelpCategoryPublic;
  articles: HelpArticleSummary[];
};

type ArticleDetailResponse = {
  locale: AppLocale;
  article: HelpArticleDetail;
  viewCount: number;
};

async function helpFetch<T>(path: string): Promise<T> {
  const res = await fetch(resolveApiUrl(path), { cache: "no-store" });
  if (!res.ok) {
    throw await parseApiClientError(res);
  }
  return res.json() as Promise<T>;
}

function localeQuery(locale: AppLocale, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ locale, ...extra });
  return params.toString();
}

export async function fetchHelpCategories(locale: AppLocale): Promise<CategoriesResponse> {
  if (!isLiveHelpCenterEnabled()) {
    return { locale, items: [], tree: [] };
  }
  return helpFetch(`/api/v1/help/categories?${localeQuery(locale)}`);
}

export async function fetchHelpCategoryBySlug(
  slug: string,
  locale: AppLocale,
): Promise<CategoryDetailResponse | null> {
  if (!isLiveHelpCenterEnabled()) return null;
  try {
    return await helpFetch(`/api/v1/help/categories/${encodeURIComponent(slug)}?${localeQuery(locale)}`);
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchHelpArticles(
  locale: AppLocale,
  query?: {
    popular?: boolean;
    gettingStarted?: boolean;
    featured?: boolean;
    categorySlug?: string;
    limit?: number;
  },
): Promise<ArticlesResponse> {
  if (!isLiveHelpCenterEnabled()) {
    return { locale, items: [], total: 0, limit: query?.limit ?? 20 };
  }
  const params: Record<string, string> = { locale };
  if (query?.popular) params.popular = "true";
  if (query?.gettingStarted) params.gettingStarted = "true";
  if (query?.featured) params.featured = "true";
  if (query?.categorySlug) params.categorySlug = query.categorySlug;
  if (query?.limit != null) params.limit = String(query.limit);
  return helpFetch(`/api/v1/help/articles?${new URLSearchParams(params).toString()}`);
}

export async function fetchHelpArticleBySlug(
  slug: string,
  locale: AppLocale,
): Promise<ArticleDetailResponse | null> {
  if (!isLiveHelpCenterEnabled()) return null;
  try {
    return await helpFetch(`/api/v1/help/articles/${encodeURIComponent(slug)}?${localeQuery(locale)}`);
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 404) return null;
    throw e;
  }
}

export type SupportHelpCenterPageData = {
  categories: HelpCategoryPublic[];
  categoryTree: HelpCategoryPublic[];
  allArticles: HelpArticleSummary[];
  popularArticles: HelpArticleSummary[];
  gettingStartedArticles: HelpArticleSummary[];
};

export async function fetchSupportHelpCenterPageData(
  locale: AppLocale,
): Promise<SupportHelpCenterPageData> {
  const [categoriesRes, allArticlesRes] = await Promise.all([
    fetchHelpCategories(locale),
    fetchHelpArticles(locale, { limit: 100 }),
  ]);

  const allArticles = allArticlesRes.items;
  const bySort = (a: HelpArticleSummary, b: HelpArticleSummary) =>
    a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);

  return {
    categories: categoriesRes.items,
    categoryTree: categoriesRes.tree,
    allArticles,
    popularArticles: allArticles.filter((a) => a.isPopular).sort(bySort).slice(0, 12),
    gettingStartedArticles: allArticles.filter((a) => a.isGettingStarted).sort(bySort).slice(0, 12),
  };
}

/** Category slugs treated as product/legal documentation hubs. */
export const HELP_DOC_CATEGORY_SLUGS = new Set(["docs", "legal", "product-docs", "documents"]);

export function filterDocArticles(articles: HelpArticleSummary[], categories: HelpCategoryPublic[]) {
  const docCategoryIds = new Set(
    categories.filter((c) => HELP_DOC_CATEGORY_SLUGS.has(c.slug)).map((c) => c.id),
  );
  return articles.filter((a) => a.categoryId && docCategoryIds.has(a.categoryId));
}

export function groupArticlesByCategory(
  articles: HelpArticleSummary[],
): Map<string, HelpArticleSummary[]> {
  const map = new Map<string, HelpArticleSummary[]>();
  for (const article of articles) {
    if (!article.categoryId) continue;
    const bucket = map.get(article.categoryId) ?? [];
    bucket.push(article);
    map.set(article.categoryId, bucket);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }
  return map;
}

export function searchHelpContent(
  query: string,
  categories: HelpCategoryPublic[],
  articles: HelpArticleSummary[],
): { categories: HelpCategoryPublic[]; articles: HelpArticleSummary[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { categories: [], articles: [] };

  const matchedCategories = categories.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q),
  );

  const matchedArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q),
  );

  return { categories: matchedCategories, articles: matchedArticles };
}
