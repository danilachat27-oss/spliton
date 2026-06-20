"use client";

import Link from "next/link";
import { Star } from "@/lib/lucide";

import { catalogReleasePrimaryHref } from "@/lib/catalog/catalog-release-nav";
import type { CatalogItem } from "@/lib/catalog-mock";
import { cn } from "@/lib/utils";

function itemSymbol(item: CatalogItem): string {
  const slug = "slug" in item ? item.slug : undefined;
  if (slug) return slug.slice(0, 6).toUpperCase();
  const words = item.title.trim().split(/\s+/);
  if (words.length >= 2) return (words[0]!.slice(0, 2) + words[1]!.slice(0, 2)).toUpperCase();
  return item.title.slice(0, 4).toUpperCase();
}

function CoverThumb({ symbol }: { symbol: string }) {
  const hue = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-9 shrink-0 rounded-full"
      style={{
        background: `linear-gradient(145deg, hsl(${hue}, 42%, 28%) 0%, hsl(${(hue + 48) % 360}, 28%, 12%) 100%)`,
      }}
      aria-hidden
    />
  );
}

function priceMeta(item: CatalogItem): { price: string; change: string; positive: boolean | null } {
  if (item.kind === "market") {
    const pos = item.sharePriceChange.trim().startsWith("+");
    const neg = item.sharePriceChange.trim().startsWith("-");
    return {
      price: item.sharePrice,
      change: item.sharePriceChange,
      positive: pos ? true : neg ? false : null,
    };
  }
  return {
    price: item.unitPriceUsdt,
    change: `${item.pct}%`,
    positive: item.pct >= 50 ? true : item.pct < 40 ? false : null,
  };
}

export function CatalogMarketInstrumentRow({
  item,
  href,
  isFavorite = false,
  onToggleFavorite,
}: {
  item: CatalogItem;
  href: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const symbol = itemSymbol(item);
  const { price, change, positive } = priceMeta(item);

  return (
    <Link href={href} className="flex items-center gap-3 border-b border-white/[0.04] py-3.5 transition-colors active:bg-white/[0.03]">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.();
        }}
        className="flex size-8 shrink-0 items-center justify-center text-zinc-600"
        aria-label={isFavorite ? "Убрать из избранного" : "Избранное"}
      >
        <Star
          className={cn("size-4", isFavorite && "fill-[#B7F500]/25 text-[#B7F500]")}
          strokeWidth={1.75}
        />
      </button>
      <CoverThumb symbol={symbol} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-snug text-white">{symbol}</p>
        <p className="truncate text-[12px] text-zinc-500">
          {item.title} · {item.artist}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-[14px] font-semibold tabular-nums text-white">{price}</p>
        <p
          className={cn(
            "font-mono text-[11px] tabular-nums",
            positive === true && "text-[#B7F500]",
            positive === false && "text-fuchsia-300",
            positive === null && "text-zinc-500",
          )}
        >
          {change}
        </p>
      </div>
    </Link>
  );
}

export function catalogItemHref(item: CatalogItem): string {
  return catalogReleasePrimaryHref(item);
}
