"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { InstrumentTickerAvatar } from "@/components/dashboard/instrument-ticker-avatar";
import { useI18n } from "@/components/providers/i18n-provider";
import { secondaryMarketBookHref } from "@/constants/dashboard/secondary-market";
import { ROUTES } from "@/constants/routes";
import { enforceFinancialLivePolicyAtRuntime } from "@/lib/live-data-policy";
import { formatUsdtFixedRu } from "@/lib/market-overview/format";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { cn } from "@/lib/utils";
import { fetchMarketOverviewList, type MarketOverviewListItemApi } from "@/services/market-overview.service";
import { getWalletDataSource } from "@/services/wallet.service";

type PreviewInstrument = {
  symbol: string;
  price: string;
  change24hPct: number;
  href: string;
};

const mockInstruments: PreviewInstrument[] = [
  { symbol: "MNR", price: "18,40 USDT", change24hPct: 2.1, href: secondaryMarketBookHref("mnr") },
  { symbol: "SGN", price: "22,10 USDT", change24hPct: 4.6, href: secondaryMarketBookHref("sgn") },
  { symbol: "VLT", price: "6,80 USDT", change24hPct: -2.3, href: secondaryMarketBookHref("vlt") },
  { symbol: "GLS", price: "9,05 USDT", change24hPct: -0.8, href: secondaryMarketBookHref("glassline") },
  { symbol: "AUR", price: "11,25 USDT", change24hPct: 0.4, href: secondaryMarketBookHref("aurora-drift") },
];

type StatTrend = "up" | "down" | "flat";

function buildInstrumentCandles(symbol: string, trend: StatTrend, count = 11) {
  let seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 42);
  const drift = trend === "up" ? 0.028 : trend === "down" ? -0.024 : 0.004;
  const candles: { open: number; close: number; high: number; low: number }[] = [];
  let price = trend === "down" ? 0.72 : 0.28;

  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = ((seed % 100) - 50) / 900;
    const open = price;
    const close = Math.max(0.12, Math.min(0.92, open + drift + noise));
    const high = Math.min(0.98, Math.max(open, close) + (seed % 40) / 500);
    const low = Math.max(0.04, Math.min(open, close) - ((seed >> 3) % 35) / 500);
    candles.push({ open, close, high, low });
    price = close;
  }

  return candles;
}

function InstrumentCandlestickBackdrop({ symbol, trend }: { symbol: string; trend: StatTrend }) {
  const candles = buildInstrumentCandles(symbol, trend);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] overflow-hidden sm:h-[62%]"
      aria-hidden
    >
      <svg
        className="animate-instrument-candle-float h-full w-full opacity-90"
        viewBox="0 0 120 64"
        preserveAspectRatio="none"
      >
        {candles.map((candle, index) => {
          const bullish = candle.close >= candle.open;
          const color = bullish ? "#B7F500" : "#f472b6";
          const slotW = 120 / candles.length;
          const cx = index * slotW + slotW / 2;
          const bodyW = slotW * 0.42;
          const y = (v: number) => 64 - v * 58 - 4;
          const bodyTop = y(Math.max(candle.open, candle.close));
          const bodyBottom = y(Math.min(candle.open, candle.close));
          const bodyH = Math.max(bodyBottom - bodyTop, 1.2);

          return (
            <g
              key={`${symbol}-${index}`}
              className="animate-instrument-candle-rise"
              style={{ animationDelay: `${index * 70}ms`, transformOrigin: "center bottom" }}
            >
              <line
                x1={cx}
                y1={y(candle.high)}
                x2={cx}
                y2={y(candle.low)}
                stroke={color}
                strokeWidth="0.75"
                opacity="0.45"
              />
              <rect
                x={cx - bodyW / 2}
                y={bodyTop}
                width={bodyW}
                height={bodyH}
                fill={color}
                opacity={bullish ? 0.55 : 0.42}
                rx="0.35"
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/40 to-transparent" />
    </div>
  );
}

function InstrumentPreviewCard({ symbol, price, change24hPct, href }: PreviewInstrument) {
  const { t } = useI18n();
  const up = change24hPct > 0;
  const down = change24hPct < 0;
  const trend: StatTrend = up ? "up" : down ? "down" : "flat";
  const changeText = `${up ? "+" : ""}${change24hPct.toLocaleString("ru-RU", {
    minimumFractionDigits: change24hPct % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })}%`;

  return (
    <div className="group relative min-h-[148px] overflow-hidden rounded-2xl bg-[#0c0c0e] ring-1 ring-white/[0.08] transition hover:bg-[#111114] hover:ring-white/12 sm:min-h-[156px]">
      <Link
        href={ROUTES.dashboardSecondaryMarket}
        aria-label={t("dashboard.openSecondaryMarket")}
        className="absolute right-3 top-3 z-20 inline-flex size-7 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200 active:scale-[0.98]"
      >
        <span className="relative block size-3" aria-hidden>
          <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 rounded-full bg-black" />
          <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rounded-full bg-black" />
        </span>
      </Link>
      <Link href={href} className="relative z-10 flex h-full min-h-[148px] flex-col px-4 py-5 sm:min-h-[156px] sm:px-5 sm:py-6">
        <InstrumentCandlestickBackdrop symbol={symbol} trend={trend} />
        <div className="relative z-10 flex h-full flex-col">
          <InstrumentTickerAvatar symbol={symbol} />
          <p className="mt-4 font-mono text-sm font-semibold tracking-tight text-white sm:text-[15px]">
            {symbol}
            <span className="text-zinc-500"> / USDT</span>
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums tracking-tight text-white sm:text-xl">{price}</p>
          <p
            className={cn(
              "mt-auto pt-3 font-mono text-sm font-medium tabular-nums",
              up && "text-[#d4f570]",
              down && "text-fuchsia-400",
              !up && !down && "text-zinc-500",
            )}
          >
            {changeText}
          </p>
        </div>
      </Link>
    </div>
  );
}

function adaptOverviewItem(item: MarketOverviewListItemApi): PreviewInstrument {
  const price = Number.parseFloat(item.lastPriceUsdt) || 0;
  const change = Number.parseFloat(item.change24hPct) || 0;
  const href = secondaryMarketBookHref(item.slug || item.symbol.toLowerCase());

  return {
    symbol: item.symbol,
    price: `${formatUsdtFixedRu(price)} USDT`,
    change24hPct: change,
    href,
  };
}

export function DashboardValueGrid({ className }: { className?: string }) {
  const { t } = useI18n();
  const live = getWalletDataSource() === "live";
  const [instruments, setInstruments] = useState<PreviewInstrument[]>([]);
  const [loading, setLoading] = useState(live);
  const [fetchError, setFetchError] = useState<unknown>(null);

  const load = useCallback(() => {
    if (!live) {
      setInstruments(mockInstruments);
      setLoading(false);
      setFetchError(null);
      return;
    }

    setLoading(true);
    setFetchError(null);

    void fetchMarketOverviewList({ sort: "activity", sortDir: "desc" })
      .then((res) => {
        setInstruments(res.items.slice(0, 5).map(adaptOverviewItem));
      })
      .catch((err) => {
        setInstruments([]);
        setFetchError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [live]);

  useEffect(() => {
    enforceFinancialLivePolicyAtRuntime("DashboardValueGrid");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section
      className={cn(
        "scroll-mt-[5.5rem] rounded-t-[24px] bg-black pb-8 sm:scroll-mt-24 sm:rounded-t-[44px] sm:pb-12 md:pb-16 lg:pb-[4.5rem]",
        className,
      )}
      aria-labelledby="dash-value-heading"
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 sm:pt-12 md:pt-16 lg:px-8 lg:pt-[4.5rem]">
        <div className="space-y-6 md:space-y-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-start justify-between gap-3 sm:block">
              <h2
                id="dash-value-heading"
                className="min-w-0 flex-1 text-[1.65rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.08]"
              >
                {t("dashboard.valueGrid.title")}
              </h2>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-400 sm:mt-4 sm:text-sm md:text-base md:leading-7">
              {t("dashboard.valueGrid.description")}
              <span className="hidden sm:inline">{t("dashboard.valueGrid.descriptionDesktop")}</span>
            </p>
          </div>

          {fetchError ? (
            <ReadOnlySectionError
              sectionId="dashboard-value-grid"
              error={fetchError}
              onRetry={load}
              variant="dark"
            />
          ) : null}

          <div className="relative min-w-0">
            <p className="mb-3 text-center font-mono text-[11px] text-zinc-600 sm:hidden">{t("dashboard.valueGrid.quotesSwipe")}</p>
            <div
              className={cn(
                "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2",
                "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                "-mx-4 px-4 sm:mx-0 sm:snap-none sm:justify-start sm:gap-4 sm:px-0 sm:pb-0",
              )}
            >
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={`sk-${i}`}
                      className="min-h-[156px] w-[min(78vw,260px)] shrink-0 snap-start animate-pulse rounded-2xl bg-white/5 sm:w-[240px] sm:min-h-[156px]"
                    />
                  ))
                : instruments.length === 0 && live
                  ? (
                    <p className="w-full py-8 text-center text-sm text-zinc-500">{t("dashboard.valueGrid.empty")}</p>
                  )
                  : instruments.map((item) => (
                    <div key={item.symbol} className="w-[min(78vw,260px)] shrink-0 snap-start sm:w-[240px]">
                      <InstrumentPreviewCard {...item} />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
