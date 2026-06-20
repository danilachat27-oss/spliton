"use client";

import Link from "next/link";
import { ArrowUpRight } from "@/lib/lucide";

import { ROUTES } from "@/constants/routes";
import { supportFocusRing } from "@/components/support/support-page-states";
import type { HelpArticleSummary } from "@/services/help-center.service";
import { cn } from "@/lib/utils";

type SupportHelpArticleCardProps = {
  article: HelpArticleSummary;
  readMoreLabel: string;
  className?: string;
};

export function SupportHelpArticleCard({ article, readMoreLabel, className }: SupportHelpArticleCardProps) {
  return (
    <Link
      href={ROUTES.supportArticle(article.slug)}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-white/[0.06] bg-[#111111] p-5 transition hover:border-white/10 hover:bg-[#141414]",
        supportFocusRing,
        className,
      )}
    >
      <h3 className="line-clamp-2 break-words text-sm font-semibold leading-snug text-white group-hover:text-zinc-100">
        {article.title}
      </h3>
      {article.excerpt ? (
        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-zinc-500">{article.excerpt}</p>
      ) : null}
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-white">
        {readMoreLabel}
        <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </span>
    </Link>
  );
}
