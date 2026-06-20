"use client";

import { useMemo } from "react";
import { Minus, Plus } from "@/lib/lucide";

import { OrderBookRow } from "@/components/dashboard/secondary-market/order-book-row";
import { SecondaryMarketBookWorkspaceHeader } from "@/components/dashboard/secondary-market/secondary-market-book-workspace-header";
import { smExchange } from "@/components/dashboard/secondary-market/secondary-market-exchange-styles";
import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

import { HERO_JOURNEY_BOOK, HERO_JOURNEY_RELEASE } from "./hero-journey-data";

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

const TICK_OPTIONS = [0.001, 0.01, 0.1] as const;

export function HeroJourneyBookPreview() {
  const { t } = useI18n();
  const book = HERO_JOURNEY_BOOK;
  const units = HERO_JOURNEY_RELEASE.units;
  const subtotal = 122.88;
  const fee = 1.35;
  const debit = subtotal + fee;

  const askRows = useMemo(() => {
    let cum = 0;
    return [...book.asks].reverse().map((row) => {
      cum += row.price * row.units;
      return { ...row, cum };
    });
  }, [book.asks]);

  const bidRows = useMemo(() => {
    let cum = 0;
    return book.bids.map((row) => {
      cum += row.price * row.units;
      return { ...row, cum };
    });
  }, [book.bids]);

  const depthMax = Math.max(
    1,
    ...book.asks.map((r) => r.units),
    ...book.bids.map((r) => r.units),
  );
  const bestAsk = book.asks[0]!.price;
  const bestBid = book.bids[0]!.price;
  const mid = (bestAsk + bestBid) / 2;
  const spread = bestAsk - bestBid;

  return (
    <div className="pointer-events-none flex min-h-0 flex-1 flex-col px-4 pb-3 pt-1 md:px-5">
      <SecondaryMarketBookWorkspaceHeader
        symbol={book.symbol}
        track={book.track}
        artist={book.artist}
        last={mid}
        change24hPct={1.24}
        high24h={1.031}
        low24h={1.021}
        volume24hUsdt={8420}
        bid={bestBid}
        ask={bestAsk}
      />

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-[minmax(280px,320px)_minmax(0,1fr)] gap-3">
        <section className="flex min-h-0 flex-col gap-3 bg-black">
          <div className="flex flex-col gap-3 rounded-lg bg-black p-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-lg bg-[#161616] p-0.5 font-mono text-[11px] ring-1 ring-white/8">
                <span className="rounded-md px-2.5 py-1.5 font-semibold text-zinc-500">{t("secondaryMarket.forms.limit")}</span>
                <span className="rounded-md bg-[#2a2a2a] px-2.5 py-1.5 font-semibold text-white">{t("secondaryMarket.forms.market")}</span>
              </div>
              <span className="font-mono text-[10px] text-zinc-600">{book.symbol}/USDT</span>
            </div>

            <div className={smExchange.sideToggle}>
              <span className={cn("rounded-md py-2 text-center", smExchange.buySideActive)}>
                {t("secondaryMarket.forms.buy")}
              </span>
              <span className={cn("rounded-md py-2 text-center", smExchange.sellSideIdle)}>
                {t("secondaryMarket.forms.sell")}
              </span>
            </div>

            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-zinc-600">{t("dashboard.heroJourney.book.availableShort")}</span>
              <span className="font-semibold text-zinc-200">2 450,00 USDT</span>
            </div>

            <div className="rounded-lg bg-black/40 px-2 py-2 font-mono text-[10px] text-zinc-400">
              <p className="text-zinc-500">{t("dashboard.heroJourney.book.askEstimateKicker")}</p>
              <p className="mt-1 text-zinc-200">
                {tf(t("dashboard.heroJourney.book.askEstimateDetail"), {
                  avg: formatUsdt(1.024),
                  units: String(units),
                  max: String(units),
                })}
              </p>
            </div>

            <div>
              <span className="font-mono text-[11px] text-zinc-500">{t("dashboard.heroJourney.book.amountUnt")}</span>
              <div className="mt-1.5 flex items-stretch gap-1">
                <span className="flex w-9 shrink-0 items-center justify-center rounded-lg bg-[#161616] text-zinc-500 ring-1 ring-white/8">
                  <Minus className="size-3.5" aria-hidden />
                </span>
                <div className={cn(smExchange.input, "flex items-center justify-center text-center")}>{units}</div>
                <span className="flex w-9 shrink-0 items-center justify-center rounded-lg bg-[#161616] text-zinc-500 ring-1 ring-white/8">
                  <Plus className="size-3.5" aria-hidden />
                </span>
              </div>
            </div>

            <div className="relative px-1 pt-1">
              <div className="h-px bg-white/10" aria-hidden />
              <div className="mt-2 flex justify-between">
                {([0, 25, 50, 75, 100] as const).map((pct) => (
                  <span key={pct} className="flex flex-col items-center gap-1">
                    <span className={cn("size-2 rounded-full", pct === 100 ? "bg-[#B7F500]" : "bg-zinc-600")} />
                    <span className="font-mono text-[9px] text-zinc-600">{pct === 0 ? "0" : `${pct}%`}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex items-center justify-between text-zinc-500">
                <span>{t("dashboard.heroJourney.book.turnoverEstimate")}</span>
                <span className="text-zinc-200">{formatUsdt(subtotal)} USDT</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>{tf(t("secondaryMarket.forms.fee"), { pct: "1,1" })}</span>
                <span className="text-zinc-300">{formatUsdt(fee)} USDT</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>{t("secondaryMarket.forms.totalDebit")}</span>
                <span className="font-semibold text-white">{formatUsdt(debit)} USDT</span>
              </div>
            </div>

            <button
              type="button"
              data-journey-target="book"
              className={cn("hero-journey-book-btn", smExchange.submitBuy)}
            >
              {t("dashboard.heroJourney.book.execute")}
            </button>
          </div>

          <div
            className="hero-journey-book-trade mt-auto rounded-lg border border-[#B7F500]/25 bg-[#B7F500]/10 px-3 py-2.5 text-left"
            aria-hidden
          >
            <p className="text-[12px] font-semibold text-[#d4f570]">{t("dashboard.heroJourney.book.tradeDone")}</p>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-300">{t("dashboard.heroJourney.book.tradeDetail")}</p>
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg bg-black ring-1 ring-white/8">
          <div className="flex border-b border-white/8 font-mono text-[11px]">
            <span className="relative flex-1 py-2 text-center font-semibold text-white">
              {t("secondaryMarket.orderBook.tabBook")}
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-white" aria-hidden />
            </span>
            <span className="flex-1 py-2 text-center font-semibold text-zinc-500">
              {t("secondaryMarket.orderBook.tabTrades")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              {t("secondaryMarket.orderBook.priceStep")}
            </span>
            <div className="flex rounded-md bg-black/50 p-0.5 font-mono text-[9px]">
              {TICK_OPTIONS.map((tick, index) => (
                <span
                  key={tick}
                  className={cn(
                    "rounded px-2 py-1 font-medium",
                    index === 1 ? "bg-white text-black" : "text-zinc-500",
                  )}
                >
                  {tick}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_56px_80px] border-b border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
            <span>{t("secondaryMarket.orderBook.priceHeader")}</span>
            <span className="text-center">{t("secondaryMarket.orderBook.unitsHeader")}</span>
            <span className="text-right">{t("secondaryMarket.orderBook.depthHeader")}</span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <p className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-fuchsia-400/90">
              {t("secondaryMarket.orderBook.sellSide")}
            </p>
            {askRows.map((row) => (
              <OrderBookRow
                key={`ask-${row.price}`}
                price={row.price}
                units={row.units}
                cumulativeUsdt={row.cum}
                depthMax={depthMax}
                variant="ask"
                compact
              />
            ))}

            <div className="border-y border-white/10 bg-black/50 px-2 py-2.5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                {t("secondaryMarket.orderBook.mid")}
              </p>
              <p className="font-mono text-lg font-semibold tabular-nums tracking-tight text-white sm:text-xl">
                {formatUsdt(mid)}
              </p>
              <p className="mt-0.5 font-mono text-[10px] tabular-nums text-zinc-600">
                {tf(t("secondaryMarket.orderBook.spreadLabel"), { spread: formatUsdt(spread) })}
              </p>
            </div>

            <p className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#B7F500]/90">
              {t("secondaryMarket.orderBook.buySide")}
            </p>
            {bidRows.map((row) => (
              <OrderBookRow
                key={`bid-${row.price}`}
                price={row.price}
                units={row.units}
                cumulativeUsdt={row.cum}
                depthMax={depthMax}
                variant="bid"
                compact
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
