import Image from "next/image";
import Link from "next/link";

import type { NewsArticle } from "@/constants/news-mock-data";
import { NEWS_CATEGORY_META } from "@/constants/news-mock-data";
import { ROUTES } from "@/constants/routes";
import { formatReadTimeLabel } from "@/lib/news-utils";
import { cn } from "@/lib/utils";

type NewsCardProps = {
  article: NewsArticle;
  className?: string;
};

export function NewsCard({ article, className }: NewsCardProps) {
  const href = `${ROUTES.news}/${encodeURIComponent(article.slug)}`;
  const categoryLabel = NEWS_CATEGORY_META[article.category].label.toUpperCase();

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-transparent transition-colors",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/[0.06]">
        <Image
          src={article.coverUrl}
          alt=""
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
          aria-hidden
        />
        {article.isNew ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#B7F500] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
            New
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{categoryLabel}</p>
        <h3 className="mt-2 line-clamp-3 text-base font-semibold leading-snug text-white transition-colors group-hover:text-[#d4f570] sm:text-[17px]">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-500">{article.excerpt}</p>
        <p className="mt-4 text-xs text-zinc-600">
          <time dateTime={article.isoDate}>{article.dateLabel}</time>
          <span aria-hidden> · </span>
          <span>{formatReadTimeLabel(article.readTimeMinutes)}</span>
        </p>
      </div>
    </Link>
  );
}
