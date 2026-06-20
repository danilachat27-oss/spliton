"use client";

import * as React from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SupportHelpArticleCard } from "@/components/support/support-help-article-card";
import {
  SupportBackLink,
  SupportPageSkeleton,
  SupportPageStatePanel,
} from "@/components/support/support-page-states";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { isLiveHelpCenterEnabled } from "@/lib/public-env";
import { fetchHelpCategoryBySlug, type HelpArticleSummary } from "@/services/help-center.service";
import {
  resolveHelpCategoryDescription,
  resolveHelpCategoryTitle,
} from "@/lib/support/help-category-display";

type LoadState = "loading" | "ready" | "notFound" | "error" | "demo";

export function SupportCategoryPageContent({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const live = isLiveHelpCenterEnabled();
  const [state, setState] = React.useState<LoadState>("loading");
  const [category, setCategory] = React.useState<{ title: string; description: string } | null>(null);
  const [articles, setArticles] = React.useState<HelpArticleSummary[]>([]);

  const load = React.useCallback(() => {
    if (!live) {
      setState("demo");
      setCategory(null);
      setArticles([]);
      return;
    }
    setState("loading");
    void fetchHelpCategoryBySlug(slug, locale)
      .then((res) => {
        if (!res) {
          setCategory(null);
          setArticles([]);
          setState("notFound");
          return;
        }
        setCategory({
          title: resolveHelpCategoryTitle(res.category, t),
          description: resolveHelpCategoryDescription(res.category, t),
        });
        setArticles(res.articles);
        setState("ready");
      })
      .catch(() => {
        setCategory(null);
        setArticles([]);
        setState("error");
      });
  }, [slug, locale, live]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-black">
      <DashboardHeader />
      <main className="relative z-10 flex-1 text-white">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <SupportBackLink label={t("support.backToCenter")} />

          {state === "loading" ? (
            <SupportPageSkeleton variant="category" loadingLabel={t("support.loading")} />
          ) : null}

          {state === "demo" ? (
            <SupportPageStatePanel message={t("support.error.demo")} tone="demo" />
          ) : null}

          {state === "error" ? (
            <SupportPageStatePanel
              message={t("support.error.live")}
              tone="error"
              actionLabel={t("support.retry")}
              onAction={load}
            />
          ) : null}

          {state === "notFound" ? (
            <SupportPageStatePanel
              message={t("support.error.notFound")}
              tone="notFound"
              actionLabel={t("support.backToCenter")}
              actionHref={ROUTES.support}
            />
          ) : null}

          {state === "ready" && category ? (
            <>
              <header className="mt-8 max-w-2xl min-w-0">
                <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  {category.title}
                </h1>
                {category.description ? (
                  <p className="mt-3 break-words text-sm leading-relaxed text-zinc-500">{category.description}</p>
                ) : null}
              </header>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {articles.length === 0 ? (
                  <p className="text-sm text-zinc-500 sm:col-span-2 lg:col-span-3">{t("support.empty.articles")}</p>
                ) : (
                  articles.map((article) => (
                    <SupportHelpArticleCard
                      key={article.id}
                      article={article}
                      readMoreLabel={t("support.article.readMore")}
                    />
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
