"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "@/lib/lucide";

import { SupportEmailContactPanel } from "@/components/support/support-email-contact-panel";
import { SupportHelpAnnouncements } from "@/components/support/support-help-announcements";
import { SupportHelpArticleCard } from "@/components/support/support-help-article-card";
import { SupportPageHero } from "@/components/support/support-page-hero";
import { SupportPageSkeleton, SupportPageStatePanel, supportFocusRing } from "@/components/support/support-page-states";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  SUPPORT_PRODUCT_DOC_LINKS,
  SUPPORT_QUICK_ACTIONS,
} from "@/constants/support-hub-config";
import { ROUTES } from "@/constants/routes";
import { isLiveHelpCenterEnabled } from "@/lib/public-env";
import {
  filterDocArticles,
  groupArticlesByCategory,
  searchHelpContent,
  fetchSupportHelpCenterPageData,
  type HelpArticleSummary,
  type HelpCategoryPublic,
  type SupportHelpCenterPageData,
} from "@/services/help-center.service";
import {
  filterPublicHelpCategories,
  resolveHelpCategoryDescription,
  resolveHelpCategoryTitle,
} from "@/lib/support/help-category-display";
import { cn } from "@/lib/utils";

const panelClass = "rounded-2xl bg-[#111111] p-4 sm:p-5 lg:p-6";
const interactivePanelClass = cn(panelClass, "transition hover:bg-[#141414]", supportFocusRing);

function SectionHeading({ id, title, hint }: { id?: string; title: string; hint?: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <h2 id={id} className="text-base font-semibold tracking-tight text-white sm:text-lg lg:text-xl">
        {title}
      </h2>
      {hint ? <p className="mt-1 max-w-2xl text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function CategoryCard({
  category,
  previews,
  viewAllLabel,
  previewLabel,
  title,
  description,
}: {
  category: HelpCategoryPublic;
  previews: HelpArticleSummary[];
  viewAllLabel: string;
  previewLabel: string;
  title: string;
  description: string;
}) {
  return (
    <article className={cn(panelClass, "flex h-full flex-col")}>
      <Link href={ROUTES.supportCategory(category.slug)} className={cn("group block rounded-lg", supportFocusRing)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-zinc-400">
              <FolderOpen className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="break-words text-sm font-semibold text-white group-hover:text-zinc-100">{title}</h3>
              {description ? (
                <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-zinc-500">{description}</p>
              ) : null}
            </div>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-zinc-600 transition group-hover:text-zinc-300" aria-hidden />
        </div>
      </Link>

      {previews.length > 0 ? (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">{previewLabel}</p>
          <ul className="mt-2 space-y-2">
            {previews.slice(0, 3).map((article) => (
              <li key={article.id}>
                <Link
                  href={ROUTES.supportArticle(article.slug)}
                  className={cn("block truncate text-xs text-zinc-400 transition hover:text-white", supportFocusRing)}
                >
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={ROUTES.supportCategory(category.slug)}
            className="mt-3 inline-flex text-xs font-medium text-zinc-500 hover:text-white"
          >
            {viewAllLabel}
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export function SupportHelpCenterPage() {
  const { t, locale } = useI18n();
  const live = isLiveHelpCenterEnabled();

  const [search, setSearch] = React.useState("");
  const [data, setData] = React.useState<SupportHelpCenterPageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    if (!live) {
      setData({
        categories: [],
        categoryTree: [],
        allArticles: [],
        popularArticles: [],
        gettingStartedArticles: [],
      });
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    void fetchSupportHelpCenterPageData(locale)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [live, locale]);

  React.useEffect(() => {
    load();
  }, [load]);

  const articlesByCategory = React.useMemo(
    () => groupArticlesByCategory(data?.allArticles ?? []),
    [data?.allArticles],
  );

  const rootCategories = React.useMemo(() => {
    const items = filterPublicHelpCategories(data?.categories ?? []);
    const roots = items.filter((c) => !c.parentId);
    return roots.length > 0 ? roots : items;
  }, [data?.categories]);

  const displayCategories = rootCategories.filter(
    (c) => !["docs", "legal", "product-docs", "documents"].includes(c.slug),
  );

  const docArticles = React.useMemo(
    () => filterDocArticles(data?.allArticles ?? [], data?.categories ?? []),
    [data?.allArticles, data?.categories],
  );

  const searchResults = React.useMemo(() => {
    if (!search.trim() || !data) return null;
    const results = searchHelpContent(search, data.categories, data.allArticles);
    return {
      ...results,
      categories: filterPublicHelpCategories(results.categories),
    };
  }, [search, data]);

  if (loading && !data) {
    return (
      <>
        <SupportPageHero search={search} onSearchChange={setSearch} />
        <SupportPageSkeleton variant="hub" loadingLabel={t("support.loading")} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <SupportPageHero search={search} onSearchChange={setSearch} />
        <SupportPageStatePanel
          message={live ? t("support.error.live") : t("support.error.demo")}
          tone={live ? "error" : "demo"}
          actionLabel={live ? t("support.retry") : undefined}
          onAction={live ? load : undefined}
        />
      </>
    );
  }

  const showMainSections = !search.trim();

  return (
    <div className="space-y-12 pb-4 sm:space-y-14">
      <SupportPageHero search={search} onSearchChange={setSearch} />

      {!live ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 text-sm text-amber-100">
          {t("support.error.demo")}
        </div>
      ) : null}

      <SupportHelpAnnouncements />

      {searchResults ? (
        <section aria-labelledby="support-search-heading">
          <SectionHeading id="support-search-heading" title={t("support.search.results")} />
          {searchResults.categories.length === 0 && searchResults.articles.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("support.search.empty")}</p>
          ) : (
            <div className="space-y-8">
              {searchResults.categories.length > 0 ? (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    {t("support.search.categories")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {searchResults.categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={ROUTES.supportCategory(cat.slug)}
                        className={cn(interactivePanelClass, "group")}
                      >
                        <span className="text-sm font-semibold text-white">{resolveHelpCategoryTitle(cat, t)}</span>
                        {resolveHelpCategoryDescription(cat, t) ? (
                          <p className="mt-1 text-xs text-zinc-500">{resolveHelpCategoryDescription(cat, t)}</p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {searchResults.articles.length > 0 ? (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    {t("support.search.articles")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {searchResults.articles.map((article) => (
                      <SupportHelpArticleCard
                        key={article.id}
                        article={article}
                        readMoreLabel={t("support.article.readMore")}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {showMainSections ? (
        <>
          <section aria-labelledby="support-popular-heading">
            <SectionHeading
              id="support-popular-heading"
              title={t("support.section.popular")}
              hint={t("support.section.popularHint")}
            />
            {(data?.popularArticles.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">{t("support.empty.articles")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.popularArticles.map((article) => (
                  <SupportHelpArticleCard
                    key={article.id}
                    article={article}
                    readMoreLabel={t("support.article.readMore")}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="support-getting-started-heading">
            <SectionHeading
              id="support-getting-started-heading"
              title={t("support.section.gettingStarted")}
              hint={t("support.section.gettingStartedHint")}
            />
            {(data?.gettingStartedArticles.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">{t("support.empty.articles")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.gettingStartedArticles.map((article) => (
                  <SupportHelpArticleCard
                    key={article.id}
                    article={article}
                    readMoreLabel={t("support.article.readMore")}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="support-categories-heading">
            <SectionHeading
              id="support-categories-heading"
              title={t("support.section.categories")}
              hint={t("support.section.categoriesHint")}
            />
            {displayCategories.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("support.empty.categories")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displayCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    title={resolveHelpCategoryTitle(category, t)}
                    description={resolveHelpCategoryDescription(category, t)}
                    previews={articlesByCategory.get(category.id) ?? []}
                    viewAllLabel={t("support.category.viewAll")}
                    previewLabel={t("support.category.articlesPreview")}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="support-quick-actions-heading">
            <SectionHeading
              id="support-quick-actions-heading"
              title={t("support.section.quickActions")}
              hint={t("support.section.quickActionsHint")}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUPPORT_QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.id} href={action.href} className={cn(interactivePanelClass, "group flex flex-col")}>
                    <span className="grid size-10 place-items-center rounded-xl bg-white/[0.06] text-zinc-300">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="mt-4 text-sm font-semibold text-white">{t(action.titleKey)}</span>
                    <span className="mt-1 block flex-1 text-xs leading-relaxed text-zinc-500">
                      {t(action.descriptionKey)}
                    </span>
                    <ArrowUpRight
                      className="mt-4 size-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-300"
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="support-product-docs-heading">
            <SectionHeading
              id="support-product-docs-heading"
              title={t("support.section.productDocs")}
              hint={t("support.section.productDocsHint")}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUPPORT_PRODUCT_DOC_LINKS.map((doc) => (
                <Link key={doc.id} href={doc.href} className={cn(interactivePanelClass, "group")}>
                  <span className="text-sm font-semibold text-white">{t(doc.titleKey)}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{t(doc.descriptionKey)}</span>
                  <ArrowUpRight
                    className="mt-4 size-4 text-zinc-600 transition group-hover:text-zinc-300"
                    aria-hidden
                  />
                </Link>
              ))}
              {docArticles.map((article) => (
                <SupportHelpArticleCard
                  key={article.id}
                  article={article}
                  readMoreLabel={t("support.article.readMore")}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      <section aria-labelledby="support-contact-heading">
        <SectionHeading
          id="support-contact-heading"
          title={t("support.section.notFound")}
          hint={t("support.section.notFoundHint")}
        />
        <SupportEmailContactPanel />
      </section>
    </div>
  );
}
