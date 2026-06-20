import Link from "next/link";
import { ArrowLeft, ExternalLink } from "@/lib/lucide";

import { ROUTES, analyticsReleaseDetailPath, catalogBuyUnitsPath } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { ReleaseMarketAnalyticsHeader } from "@/types/catalog/release-market-analytics";

const ICON_BTN = cn(
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/6 text-zinc-400",
  "transition-colors hover:bg-white/10 hover:text-zinc-200",
);

const ACTION_OPEN = cn(
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white/6 px-3.5 text-[12px] font-medium text-zinc-200",
  "transition-colors hover:bg-white/10 hover:text-white",
);

const ACTION_BUY_UNITS = cn(
  "inline-flex h-9 items-center justify-center rounded-lg bg-[#B7F500] px-3.5 text-[12px] font-semibold text-black",
  "transition-colors hover:bg-[#c8ff3d]",
);

const ACTION_SECONDARY_MARKET = cn(
  "inline-flex h-9 items-center justify-center rounded-lg bg-white px-3.5 text-[12px] font-semibold text-black",
  "transition-colors hover:bg-zinc-100",
);

export function ReleaseAnalyticsStickyHeader({ header }: { header: ReleaseMarketAnalyticsHeader }) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-white/6 bg-black/95 backdrop-blur-sm supports-backdrop-filter:bg-black/85">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-3.5 md:flex-row md:items-start md:justify-between md:gap-6 md:py-4">
          <div className="flex min-w-0 gap-3">
            <Link href={ROUTES.catalogMarketOverview} className={cn(ICON_BTN, "mt-0.5")} aria-label="Назад к обзору рынка">
              <ArrowLeft className="size-4" strokeWidth={1.75} />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold tracking-tight text-white md:text-2xl">{header.releaseTitle}</h1>
              <p className="mt-1 text-[14px] font-medium text-zinc-400">{header.artist}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 md:pt-0.5 md:justify-end">
            <Link
              href={`${analyticsReleaseDetailPath(header.catalogReleaseId)}?from=catalog`}
              className={ACTION_OPEN}
            >
              Открыть релиз
              <ExternalLink className="size-3.5 opacity-60" strokeWidth={1.75} aria-hidden />
            </Link>
            <Link href={catalogBuyUnitsPath(header.catalogReleaseId)} className={ACTION_BUY_UNITS}>
              Купить UNT
            </Link>
            <Link href={ROUTES.dashboardSecondaryMarket} className={ACTION_SECONDARY_MARKET}>
              Secondary market
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
