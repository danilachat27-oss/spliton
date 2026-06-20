import type { Metadata } from "next";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NewsPageContent } from "@/components/news/news-page-content";
import { NewsPageHero } from "@/components/news/news-page-hero";
import { newsPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return newsPageMetaAsync("meta.news.title", "meta.news.description");
}

export default function NewsPage() {
  return (
    <div className="relative min-h-dvh bg-black">
      <DashboardHeader />
      <main className="relative z-10">
        <section className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8">
          <NewsPageHero />
          <NewsPageContent />
        </section>
      </main>
    </div>
  );
}
