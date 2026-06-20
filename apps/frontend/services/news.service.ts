import type { NewsArticle, NewsCategoryFilterId } from "@/constants/news-mock-data";
import {
  NEWS_PAGE_SIZE,
  findNewsArticleBySlug,
  getNewsCoverUrl,
  newsArticlesMock,
} from "@/constants/news-mock-data";
import { estimateReadTimeMinutes } from "@/lib/news-utils";
import { parseApiClientError } from "@/lib/api/api-client-error";
import { isLiveNewsEnabled, resolveApiUrl } from "@/lib/public-env";
import type { NewsCategoryId } from "@/constants/news-mock-data";

export type PublicNewsItem = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  coverUrl: string | null;
  category: string;
  publishAt: string | null;
  pinned: boolean;
};

export type PublicNewsListResponse = {
  items: PublicNewsItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublicNewsDetail = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  content: string;
  coverUrl: string | null;
  category: string;
  publishAt: string | null;
};

export type NewsListQuery = {
  page?: number;
  pageSize?: number;
  category?: NewsCategoryFilterId;
  q?: string;
};

export type NewsListResult = {
  items: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const CATEGORY_MAP: Record<string, NewsCategoryId> = {
  platform: "product",
  updates: "product",
  finance: "payouts",
  releases: "product",
  market: "market",
  maintenance: "product",
  warning: "legal",
  product: "product",
  payouts: "payouts",
  legal: "legal",
};

function formatDateLabel(iso: string | null): { isoDate: string; dateLabel: string } {
  if (!iso) {
    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    return {
      isoDate,
      dateLabel: now.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) + " г.",
    };
  }
  const d = new Date(iso);
  return {
    isoDate: d.toISOString().slice(0, 10),
    dateLabel: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) + " г.",
  };
}

function mapItem(row: PublicNewsItem, index: number): NewsArticle {
  const dates = formatDateLabel(row.publishAt);
  const category = CATEGORY_MAP[row.category] ?? "product";
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const isNew = row.publishAt ? new Date(row.publishAt).getTime() >= weekAgo : index < 2;
  const excerpt = row.shortDescription?.trim() || "—";
  const content = `<p>${excerpt}</p>`;
  return {
    id: row.id,
    slug: row.slug,
    isoDate: dates.isoDate,
    dateLabel: dates.dateLabel,
    category,
    title: row.title,
    excerpt,
    content,
    coverUrl: row.coverUrl?.trim() || getNewsCoverUrl(index),
    readTimeMinutes: estimateReadTimeMinutes(`${row.title} ${excerpt} ${content}`),
    isNew,
  };
}

function filterMockArticles(query: NewsListQuery): NewsArticle[] {
  const q = query.q?.trim().toLowerCase();
  let items = [...newsArticlesMock];

  if (query.category && query.category !== "all") {
    items = items.filter((a) => a.category === query.category);
  }

  if (q) {
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    );
  }

  return items;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function fetchPublicNewsList(query: NewsListQuery = {}): Promise<NewsListResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? NEWS_PAGE_SIZE;

  if (!isLiveNewsEnabled()) {
    return paginate(filterMockArticles(query), page, pageSize);
  }

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const url = resolveApiUrl(`/api/v1/news?${params.toString()}`);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw await parseApiClientError(res);
  }
  const body = (await res.json()) as PublicNewsListResponse;
  let items = body.items.map((item, idx) => mapItem(item, idx));

  if (query.category && query.category !== "all") {
    items = items.filter((a) => a.category === query.category);
  }
  if (query.q?.trim()) {
    const q = query.q.trim().toLowerCase();
    items = items.filter(
      (a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q),
    );
  }

  const totalPages = Math.max(1, Math.ceil(body.total / pageSize));
  return {
    items,
    total: query.category || query.q ? items.length : body.total,
    page: body.page,
    pageSize: body.pageSize,
    totalPages,
  };
}

export async function fetchPublicNewsBySlug(slug: string): Promise<PublicNewsDetail | null> {
  if (!isLiveNewsEnabled()) {
    const article = findNewsArticleBySlug(slug);
    if (!article) return null;
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      shortDescription: article.excerpt,
      content: article.content,
      coverUrl: article.coverUrl,
      category: article.category,
      publishAt: article.isoDate,
    };
  }

  const url = resolveApiUrl(`/api/v1/news/${encodeURIComponent(slug)}`);
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw await parseApiClientError(res);
  }
  return res.json() as Promise<PublicNewsDetail>;
}
