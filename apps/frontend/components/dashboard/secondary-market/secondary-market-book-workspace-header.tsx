"use client";

import Link from "next/link";
import { ChevronDown } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { cn } from "@/lib/utils";

import { smExchange } from "./secondary-market-exchange-styles";

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function SecondaryMarketBookWorkspaceHeader({
  symbol,
  track,
  artist,
  last,
  change24hPct,
  high24h,
  low24h,
  volume24hUsdt,
  bid,
  ask,
}: {
  symbol: string;
  track: string;
  artist: string;
  last: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24hUsdt: number;
  bid: number;
  ask: number;
}) {
  const { t } = useI18n();
  const chPos = change24hPct >= 0;

  return (
    <div className="sticky top-0 z-30 -mx-3 border-b border-white/6 bg-black px-3 pb-3 pt-1 md:-mx-5 md:px-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={secondaryMarketHref("market")}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="shrink-0 text-[13px] font-medium text-zinc-500">←</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[16px] font-bold text-white">{symbol}/USDT</span>
              <ChevronDown className="size-4 shrink-0 text-zinc-500" aria-hidden />
            </div>
            <p className="truncate text-[11px] text-zinc-500">{track} · {artist}</p>
          </div>
        </Link>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[18px] font-bold tabular-nums leading-none text-white">
            {last > 0 ? formatUsdt(last) : "—"}
          </p>
          <p
            className={cn(
              "mt-0.5 font-mono text-[12px] font-semibold tabular-nums",
              chPos ? "text-[#B7F500]" : "text-fuchsia-300",
            )}
          >
            {chPos ? "+" : ""}
            {change24hPct.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="shrink-0">
          <p className={smExchange.statLabel}>Max 24ч</p>
          <p className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-zinc-300">
            {high24h > 0 ? formatUsdt(high24h) : "—"}
          </p>
        </div>
        <div className="shrink-0">
          <p className={smExchange.statLabel}>Min 24ч</p>
          <p className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-zinc-300">
            {low24h > 0 ? formatUsdt(low24h) : "—"}
          </p>
        </div>
        <div className="shrink-0">
          <p className={smExchange.statLabel}>Bid</p>
          <p className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-[#B7F500]">
            {bid > 0 ? formatUsdt(bid) : "—"}
          </p>
        </div>
        <div className="shrink-0">
          <p className={smExchange.statLabel}>Ask</p>
          <p className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-fuchsia-300">
            {ask > 0 ? formatUsdt(ask) : "—"}
          </p>
        </div>
        <div className="shrink-0">
          <p className={smExchange.statLabel}>{t("secondaryMarket.orderBook.volume24h")}</p>
          <p className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-zinc-300">
            {formatUsdt(volume24hUsdt)} USDT
          </p>
        </div>
      </div>
    </div>
  );
}
