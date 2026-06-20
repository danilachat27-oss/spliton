import type { Metadata } from "next";

import { SupportCategoryPageContent } from "@/components/support/support-category-page-content";
import { fetchHelpCategoryMetaForSeo } from "@/lib/help-center/help-center-server";
import { supportPageMetaAsync } from "@/lib/i18n/page-metadata";
import { resolveServerLocale } from "@/lib/i18n/server-locale";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveServerLocale();
  const category = await fetchHelpCategoryMetaForSeo(slug, locale);

  if (!category) {
    return supportPageMetaAsync("meta.support.notFound.title", "meta.support.notFound.description");
  }

  const base = await supportPageMetaAsync("meta.support.title", "meta.support.description");
  const title = category.title;
  const description = category.description || undefined;

  return {
    ...base,
    title: `${title} · ${typeof base.title === "string" ? base.title : "Support"}`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function SupportCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  return <SupportCategoryPageContent slug={slug} />;
}
