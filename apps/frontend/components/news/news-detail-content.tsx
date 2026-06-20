import Image from "next/image";
import Link from "next/link";

import { NEWS_CATEGORY_META } from "@/constants/news-mock-data";
import type { NewsCategoryId } from "@/constants/news-mock-data";
import { ROUTES } from "@/constants/routes";
import { estimateReadTimeMinutes, formatReadTimeLabel } from "@/lib/news-utils";
import { cn } from "@/lib/utils";

const CATEGORY_MAP: Record<string, NewsCategoryId> = {
  platform: "product",
  updates: "product",
  finance: "payouts",
  releases: "product",
  market: "market",
  maintenance: "product",
  warning: "legal",
  product: "product",
  payouts: "payouts",
  legal: "legal",
};

export type NewsDetailView = {
  title: string;
  slug: string;
  shortDescription: string | null;
  content: string;
  coverUrl: string | null;
  category: string;
  publishAt: string | null;
};

type NewsDetailContentProps = {
  post: NewsDetailView;
  className?: string;
};

function formatPublishLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) + " г.";
}

export function NewsDetailContent({ post, className }: NewsDetailContentProps) {
  const categoryId = CATEGORY_MAP[post.category.toLowerCase()] ?? "product";
  const categoryLabel = NEWS_CATEGORY_META[categoryId].label.toUpperCase();
  const dateLabel = formatPublishLabel(post.publishAt);
  const readMinutes = estimateReadTimeMinutes(
    `${post.title} ${post.shortDescription ?? ""} ${post.content.replace(/<[^>]+>/g, " ")}`,
  );
  const cover = post.coverUrl?.trim() || "/images/fees/back.png";

  return (
    <article className={cn("mx-auto max-w-3xl", className)}>
      <Link
        href={ROUTES.news}
        className="inline-flex text-sm font-medium text-zinc-500 transition-colors hover:text-white"
      >
        ← Все новости
      </Link>

      <header className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{categoryLabel}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{post.title}</h1>
        {(dateLabel || readMinutes) && (
          <p className="mt-4 text-sm text-zinc-500">
            {dateLabel ? <time dateTime={post.publishAt ?? undefined}>{dateLabel}</time> : null}
            {dateLabel ? <span aria-hidden> · </span> : null}
            <span>{formatReadTimeLabel(readMinutes)}</span>
          </p>
        )}
        {post.shortDescription ? (
          <p className="mt-4 text-base leading-relaxed text-zinc-400">{post.shortDescription}</p>
        ) : null}
      </header>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/[0.06]">
        <Image src={cover} alt="" fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 768px" priority />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
      </div>

      <div
        className="prose prose-invert prose-zinc mt-10 max-w-none prose-p:text-zinc-300 prose-p:leading-relaxed prose-headings:text-white prose-a:text-[#d4f570] prose-strong:text-white"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
