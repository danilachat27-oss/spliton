"use client";

import * as React from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { UnderlineTab } from "@/components/shared/exchange/underline-tab";
import {
  isSecondaryBookMarketQuery,
  SECONDARY_MARKET_TAB_META,
  parseSecondaryMarketTabParam,
  type SecondaryMarketTabId,
  type SecondaryMarketTabZone,
} from "@/constants/dashboard/secondary-market";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  useSecondaryMarketPageMeta,
  useSecondaryMarketTabs,
} from "@/hooks/use-secondary-market-i18n";
import { secondaryMarketBookPath } from "@/constants/routes";
import {
  getSecondaryMarketListingByReleaseId,
  isSecondaryMarketReleaseIdKnown,
} from "@/mocks/dashboard/secondary-market-listings.mock";
import { getWalletDataSource } from "@/services/wallet.service";

import { cn } from "@/lib/utils";

const SecondaryMarketMarketTab = dynamic(
  () =>
    import("@/components/dashboard/secondary-market/secondary-market-market-tab").then(
      (mod) => ({ default: mod.SecondaryMarketMarketTab }),
    ),
);
const SecondaryMarketReleaseAnalyticsTab = dynamic(
  () =>
    import("@/components/dashboard/secondary-market/secondary-market-release-analytics-tab").then(
      (mod) => ({ default: mod.SecondaryMarketReleaseAnalyticsTab }),
    ),
);
const SecondaryMarketMyOrdersTab = dynamic(
  () =>
    import("@/components/dashboard/secondary-market/secondary-market-my-orders-tab").then(
      (mod) => ({ default: mod.SecondaryMarketMyOrdersTab }),
    ),
);
const SecondaryMarketTradeHistoryTab = dynamic(
  () =>
    import("@/components/dashboard/secondary-market/secondary-market-trade-history-tab").then(
      (mod) => ({ default: mod.SecondaryMarketTradeHistoryTab }),
    ),
);
const SecondaryMarketWatchlistTab = dynamic(
  () =>
    import("@/components/dashboard/secondary-market/secondary-market-watchlist-tab").then(
      (mod) => ({ default: mod.SecondaryMarketWatchlistTab }),
    ),
);
const SecondaryMarketRulesTab = dynamic(
  () =>
    import("@/components/dashboard/secondary-market/secondary-market-rules-tab").then(
      (mod) => ({ default: mod.SecondaryMarketRulesTab }),
    ),
);

const ZONE_PILL: Record<SecondaryMarketTabZone, string> = {
  trading: "bg-[#B7F500]/12 text-[#d4f570] ring-1 ring-[#B7F500]/22",
  operations: "bg-sky-500/10 text-sky-200/95 ring-1 ring-sky-400/18",
  ledger: "bg-violet-500/10 text-violet-200/95 ring-1 ring-violet-400/18",
  research: "bg-fuchsia-500/10 text-fuchsia-200/95 ring-1 ring-fuchsia-400/18",
  reference: "bg-amber-500/10 text-amber-200/95 ring-1 ring-amber-400/18",
};

const RELEASE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function SecondaryMarketScreenInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const tabs = useSecondaryMarketTabs();

  const tab: SecondaryMarketTabId = parseSecondaryMarketTabParam(searchParams.get("tab")) ?? "market";

  const setTab = React.useCallback(
    (id: SecondaryMarketTabId) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", id);
      if (id !== "market") next.delete("market");
      if (id !== "analytics") next.delete("release");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (rawTab !== "book") return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "market");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  /** Старые ссылки `?tab=market&market=` ведут на отдельную страницу стакана. */
  React.useEffect(() => {
    const m = searchParams.get("market");
    if (tab !== "market" || !isSecondaryBookMarketQuery(m)) return;
    router.replace(secondaryMarketBookPath(m));
  }, [router, searchParams, tab]);

  const pageMeta = useSecondaryMarketPageMeta(tab);
  const tabZone = SECONDARY_MARKET_TAB_META[tab].zone;

  const releaseRaw = searchParams.get("release");
  const walletLive = getWalletDataSource() === "live";
  const analyticsReleaseId =
    tab === "analytics" && releaseRaw
      ? isSecondaryMarketReleaseIdKnown(releaseRaw) ||
        (walletLive && RELEASE_UUID_RE.test(releaseRaw))
        ? releaseRaw
        : null
      : null;
  const analyticsUnknownRelease =
    tab === "analytics" &&
    typeof releaseRaw === "string" &&
    releaseRaw.length > 0 &&
    !analyticsReleaseId;

  React.useEffect(() => {
    let head = pageMeta.documentTitle;
    if (tab === "analytics" && analyticsReleaseId) {
      const row = getSecondaryMarketListingByReleaseId(analyticsReleaseId);
      if (row) head = `${row.symbol} · ${head}`;
    }
    document.title = `${head} · ${t("meta.secondaryMarket.productSuffix")}`;
  }, [analyticsReleaseId, pageMeta.documentTitle, tab, t]);

  const tabBody = (() => {
    switch (tab) {
      case "market":
        return <SecondaryMarketMarketTab />;
      case "analytics":
        return (
          <SecondaryMarketReleaseAnalyticsTab
            releaseId={analyticsReleaseId}
            unknownReleaseQuery={analyticsUnknownRelease}
          />
        );
      case "orders":
        return <SecondaryMarketMyOrdersTab />;
      case "history":
        return <SecondaryMarketTradeHistoryTab />;
      case "watchlist":
        return <SecondaryMarketWatchlistTab />;
      case "rules":
        return <SecondaryMarketRulesTab />;
      default:
        return <SecondaryMarketMarketTab />;
    }
  })();

  return (
    <div className="flex min-h-0 flex-col bg-black font-sans tabular-nums text-white antialiased">
      <header className="sticky top-0 z-40 shrink-0 bg-black">
        <div className="mx-auto w-full max-w-[1400px]">
          <nav
            className="flex min-h-11 w-full items-center gap-1 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-2 md:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden"
            aria-label={t("secondaryMarket.aria.tabsNav")}
          >
            {tabs.map((tabItem) => (
              <UnderlineTab
                key={tabItem.id}
                active={tab === tabItem.id}
                onClick={() => setTab(tabItem.id)}
                size="exchange"
                tone="neutral"
              >
                {tabItem.label}
              </UnderlineTab>
            ))}
          </nav>
        </div>
      </header>

      <main
        className="min-h-0 flex-1"
        aria-label={t("meta.secondaryMarket.title")}
      >
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
          {tab === "analytics" ? (
            <div className="border-b border-white/6 pb-4 pt-4 md:pt-5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]",
                  ZONE_PILL[tabZone],
                )}
              >
                {pageMeta.zoneLabel}
              </span>
              <h1 className="mt-3 text-xl font-semibold tracking-tight text-white md:text-2xl">
                {pageMeta.surfaceTitle}
              </h1>
            </div>
          ) : null}

          <div key={`${tab}-body`} className="animate-secondary-market-surface-in pb-20 pt-3 md:pt-4">
            {tabBody}
          </div>
        </div>
      </main>
    </div>
  );
}

export function SecondaryMarketScreen() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-black" aria-hidden />}>
      <SecondaryMarketScreenInner />
    </Suspense>
  );
}
