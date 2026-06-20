import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NewsDetailContent } from "@/components/news/news-detail-content";
import { NewsDetailLoadError } from "@/components/news/news-detail-load-error";
import { findNewsArticleBySlug } from "@/constants/news-mock-data";
import { isLiveNewsEnabled } from "@/lib/public-env";
import { fetchPublicNewsBySlug } from "@/services/news.service";

async function loadNews(slug: string) {
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
  return fetchPublicNewsBySlug(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await loadNews(slug);
    if (!post) return { title: "Новость не найдена" };
    return {
      title: post.title,
      description: post.shortDescription ?? undefined,
    };
  } catch {
    return { title: "Новость" };
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const post = await loadNews(slug);
    if (!post) notFound();

    return (
      <div className="relative min-h-dvh bg-black">
        <DashboardHeader />
        <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <NewsDetailContent post={post} />
        </main>
      </div>
    );
  } catch {
    return (
      <div className="relative min-h-dvh bg-black">
        <DashboardHeader />
        <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <NewsDetailLoadError />
        </main>
      </div>
    );
  }
}
