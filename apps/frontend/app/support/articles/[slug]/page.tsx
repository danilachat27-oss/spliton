import type { Metadata } from "next";

import { SupportArticlePageContent } from "@/components/support/support-article-page-content";
import { fetchHelpArticleMetaForSeo } from "@/lib/help-center/help-center-server";
import { supportPageMetaAsync } from "@/lib/i18n/page-metadata";
import { resolveServerLocale } from "@/lib/i18n/server-locale";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveServerLocale();
  const article = await fetchHelpArticleMetaForSeo(slug, locale);

  if (!article) {
    return supportPageMetaAsync("meta.support.notFound.title", "meta.support.notFound.description");
  }

  const base = await supportPageMetaAsync("meta.support.title", "meta.support.description");
  const title = article.metaTitle?.trim() || article.title;
  const description = article.metaDescription?.trim() || article.excerpt || undefined;

  return {
    ...base,
    title: `${title} · ${typeof base.title === "string" ? base.title : "Support"}`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

export default async function SupportArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <SupportArticlePageContent slug={slug} />;
}
