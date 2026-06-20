"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  LineChart,
} from "@/lib/lucide";
import { useI18n } from "@/components/providers/i18n-provider";
import { secondaryMarketBookHref, secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { cn } from "@/lib/utils";

type ActionRowProps = {
  href: string;
  title: string;
  description: string;
  label: string;
  icon: typeof BookOpen;
  variant?: "primary" | "secondary" | "ghost";
  scroll?: boolean;
};

function ActionRow({
  href,
  title,
  description,
  label,
  icon: Icon,
  variant = "secondary",
  scroll,
}: ActionRowProps) {
  return (
    <Link
      href={href}
      scroll={scroll}
      title={title}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 ring-1 transition",
        variant === "primary" &&
          "bg-[#B7F500] text-black ring-[#B7F500]/40 hover:bg-[#c8ff3d]",
        variant === "secondary" &&
          "bg-white/[0.03] text-zinc-100 ring-white/10 hover:bg-white/[0.06] hover:ring-[#B7F500]/25",
        variant === "ghost" &&
          "bg-transparent text-zinc-400 ring-white/6 hover:bg-white/[0.04] hover:text-zinc-200",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          variant === "primary" ? "bg-black/10 text-black" : "bg-[#B7F500]/10 text-[#B7F500]",
        )}
        aria-hidden
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight">{label}</span>
        <span
          className={cn(
            "mt-0.5 block text-[11px] leading-snug",
            variant === "primary" ? "text-black/65" : "text-zinc-500 group-hover:text-zinc-400",
          )}
        >
          {description}
        </span>
      </span>
      <ChevronRight
        className={cn(
          "size-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-80",
          variant === "primary" ? "text-black/50" : "text-zinc-500",
        )}
        aria-hidden
      />
    </Link>
  );
}

type Props = {
  symbol: string;
  releaseTitle: string;
  artist: string;
  bookId: string | null;
  releaseAnalyticsHref: string;
  tradingAnalyticsHref: string;
};

export function SecondaryMarketListingActionPanel({
  symbol,
  releaseTitle,
  artist,
  bookId,
  releaseAnalyticsHref,
  tradingAnalyticsHref,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-2xl bg-[#111111] ring-1 ring-white/10">
      <div className="border-b border-white/8 bg-gradient-to-br from-[#B7F500]/8 via-transparent to-transparent px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          {t("secondaryMarket.listingDetail.linkedRelease")}
        </p>
        <p className="mt-2 font-mono text-lg font-semibold text-white">{symbol}</p>
        <p className="mt-1 text-sm font-medium text-zinc-300">{releaseTitle}</p>
        <p className="mt-0.5 font-mono text-xs text-zinc-600">{artist}</p>
      </div>

      <div className="flex flex-col gap-2 p-4">
        {bookId ? (
          <ActionRow
            href={secondaryMarketBookHref(bookId)}
            title={t("secondaryMarket.listingDetail.openBookTitle")}
            description={t("secondaryMarket.listingDetail.openBookHint")}
            label={t("secondaryMarket.listingDetail.openBook")}
            icon={BookOpen}
            variant="primary"
          />
        ) : (
          <ActionRow
            href={secondaryMarketHref("market")}
            title={t("secondaryMarket.listingDetail.goToMarketListTitle")}
            description={t("secondaryMarket.listingDetail.goToMarketHint")}
            label={t("secondaryMarket.listingDetail.goToSecondaryMarket")}
            icon={LayoutGrid}
            variant="primary"
          />
        )}

        <ActionRow
          href={tradingAnalyticsHref}
          scroll={false}
          title={t("secondaryMarket.listingDetail.tradingAnalyticsLinkTitle")}
          description={t("secondaryMarket.listingDetail.tradingAnalyticsHint")}
          label={t("secondaryMarket.listingDetail.tradingAnalyticsLink")}
          icon={LineChart}
        />

        <ActionRow
          href={releaseAnalyticsHref}
          title={t("secondaryMarket.listingDetail.releaseAnalyticsLinkTitle")}
          description={t("secondaryMarket.listingDetail.releaseAnalyticsHint")}
          label={t("secondaryMarket.listingDetail.releaseAnalyticsLink")}
          icon={ExternalLink}
        />

        <ActionRow
          href={secondaryMarketHref("market")}
          title={t("secondaryMarket.listingDetail.goToMarketListTitle")}
          description={t("secondaryMarket.listingDetail.marketOverviewHint")}
          label={t("secondaryMarket.listingDetail.marketOverview")}
          icon={LayoutGrid}
          variant="ghost"
        />
      </div>
    </div>
  );
}
