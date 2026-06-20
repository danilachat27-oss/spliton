"use client";

import * as React from "react";
import { Search } from "@/lib/lucide";

import { NewsCard } from "@/components/news/news-card";
import { NewsCategoryFilters } from "@/components/news/news-category-filters";
import { NewsPagination } from "@/components/news/news-pagination";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import type { NewsCategoryFilterId } from "@/constants/news-mock-data";
import { NEWS_PAGE_SIZE } from "@/constants/news-mock-data";
import { isLiveNewsEnabled } from "@/lib/public-env";
import { fetchPublicNewsList } from "@/services/news.service";
import { cn } from "@/lib/utils";

export function NewsPageContent() {
  const { t } = useI18n();
  const [category, setCategory] = React.useState<NewsCategoryFilterId>("all");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [articles, setArticles] = React.useState<Awaited<ReturnType<typeof fetchPublicNewsList>>["items"]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [category, debouncedSearch]);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    void fetchPublicNewsList({
      page,
      pageSize: NEWS_PAGE_SIZE,
      category,
      q: debouncedSearch || undefined,
    })
      .then((result) => {
        setArticles(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, category, debouncedSearch]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCategoryChange = (id: NewsCategoryFilterId) => {
    setCategory(id);
  };

  return (
    <div className="space-y-8 pb-4 sm:space-y-10">
      <section className="border-b border-white/[0.06] pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-zinc-500">
            {t("news.breadcrumb")} <span className="mx-1 text-zinc-700">›</span>{" "}
            <span className="text-zinc-300">{t("news.breadcrumbBlog")}</span>
          </p>
          <label className="relative block w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("news.searchPlaceholder")}
              className="h-10 w-full rounded-full border border-white/10 bg-zinc-950 pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </label>
        </div>

        <div className="mt-5 overflow-x-auto pb-1">
          <NewsCategoryFilters active={category} onChange={handleCategoryChange} className="min-w-max sm:min-w-0" />
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("news.blogTitle")}
            {!loading && !error ? ` (${total})` : ""}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">{t("news.blogSubtitle")}</p>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: NEWS_PAGE_SIZE }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[16/10] rounded-xl bg-zinc-900" />
              <div className="mt-4 h-3 w-16 rounded bg-zinc-900" />
              <div className="mt-3 h-5 w-full rounded bg-zinc-900" />
              <div className="mt-2 h-4 w-4/5 rounded bg-zinc-900" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
          <p className="text-sm text-red-200">
            {isLiveNewsEnabled() ? t("news.error.live") : t("news.error.demo")}
          </p>
          <Button type="button" variant="outline" className="mt-4 border-white/15 bg-transparent text-white hover:bg-zinc-900" onClick={load}>
            {t("news.retry")}
          </Button>
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl bg-zinc-950 px-6 py-16 text-center ring-1 ring-white/[0.06]">
          <p className="text-sm font-medium text-white">{t("news.empty.title")}</p>
          <p className="mt-2 text-sm text-zinc-500">
            {debouncedSearch ? t("news.empty.searchHint") : t("news.empty.categoryHint")}
          </p>
          {(debouncedSearch || category !== "all") && (
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-white/15 bg-transparent text-white hover:bg-zinc-900"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              {t("news.empty.resetFilters")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <section aria-label={t("news.list.aria")}>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </section>

          <NewsPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className={cn("pt-4")}
          />
        </>
      )}
    </div>
  );
}
