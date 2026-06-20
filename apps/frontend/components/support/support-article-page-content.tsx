"use client";

import * as React from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SupportBreadcrumbs } from "@/components/support/support-breadcrumbs";
import {
  SupportBackLink,
  SupportPageSkeleton,
  SupportPageStatePanel,
} from "@/components/support/support-page-states";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { isLiveHelpCenterEnabled } from "@/lib/public-env";
import { fetchHelpArticleBySlug } from "@/services/help-center.service";

type LoadState = "loading" | "ready" | "notFound" | "error" | "demo";

export function SupportArticlePageContent({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const live = isLiveHelpCenterEnabled();
  const [state, setState] = React.useState<LoadState>("loading");
  const [content, setContent] = React.useState<{
    title: string;
    excerpt: string;
    body: string;
    breadcrumbs: Array<{ slug: string; title: string }>;
  } | null>(null);

  const load = React.useCallback(() => {
    if (!live) {
      setState("demo");
      setContent(null);
      return;
    }
    setState("loading");
    void fetchHelpArticleBySlug(slug, locale)
      .then((res) => {
        if (!res) {
          setContent(null);
          setState("notFound");
          return;
        }
        setContent({
          title: res.article.title,
          excerpt: res.article.excerpt,
          body: res.article.content,
          breadcrumbs: res.article.breadcrumbs,
        });
        setState("ready");
      })
      .catch(() => {
        setContent(null);
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
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <SupportBackLink label={t("support.backToCenter")} />

          {state === "loading" ? (
            <SupportPageSkeleton variant="article" loadingLabel={t("support.loading")} />
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

          {state === "ready" && content ? (
            <article className="mt-8 min-w-0">
              <SupportBreadcrumbs
                items={content.breadcrumbs}
                homeLabel={t("support.backToCenter")}
                ariaLabel={t("support.breadcrumb.aria")}
              />
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {content.title}
              </h1>
              {content.excerpt ? (
                <p className="mt-3 break-words text-sm leading-relaxed text-zinc-500">{content.excerpt}</p>
              ) : null}
              <div className="prose prose-invert mt-8 max-w-none break-words text-sm leading-relaxed text-zinc-300 [overflow-wrap:anywhere] whitespace-pre-wrap">
                {content.body}
              </div>
            </article>
          ) : null}
        </div>
      </main>
    </div>
  );
}
