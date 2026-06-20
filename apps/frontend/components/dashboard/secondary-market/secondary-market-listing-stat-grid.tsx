"use client";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Percent,
  Signal,
  TrendingUp,
} from "@/lib/lucide";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ReleaseDetailQuickStat } from "@/types/analytics/release-detail";
import { cn } from "@/lib/utils";

import {
  SecondaryMarketListingMetricCard,
  type ListingMetricTone,
  type ListingMetricTrend,
} from "./secondary-market-listing-metric-card";

function parseNumber(value: string): number | null {
  const m = value.replace(/\s/g, "").match(/-?[\d.,]+/);
  if (!m) return null;
  return Number.parseFloat(m[0].replace(",", "."));
}

function statMeta(
  stat: ReleaseDetailQuickStat,
  t: (key: string) => string,
): {
  icon: typeof BarChart3;
  tone: ListingMetricTone;
  trend: ListingMetricTrend;
  trendTitle?: string;
  footer?: React.ReactNode;
} {
  const label = stat.label.toLowerCase();
  const num = parseNumber(stat.value);

  if (label.includes("24") || label.includes("volume") || label.includes("объём") || label.includes("objeto")) {
    return { icon: BarChart3, tone: "neutral", trend: null };
  }
  if (label.includes("сдел") || label.includes("trade") || label.includes("operac")) {
    const n = num ?? 0;
    return {
      icon: Activity,
      tone: n > 0 ? "neutral" : "muted",
      trend: n > 0 ? "up" : "flat",
      trendTitle: n > 0 ? undefined : t("secondaryMarket.listingDetail.noTrades7d"),
    };
  }
  if (label.includes("7д") || label.includes("7d") || label.includes("%")) {
    const pct = num ?? 0;
    return {
      icon: TrendingUp,
      tone: pct > 0 ? "positive" : pct < 0 ? "negative" : "muted",
      trend: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
      trendTitle:
        pct > 0
          ? t("secondaryMarket.listingDetail.trendUp7d")
          : pct < 0
            ? t("secondaryMarket.listingDetail.trendDown7d")
            : t("secondaryMarket.listingDetail.trendFlat7d"),
    };
  }
  if (label.includes("спред") || label.includes("spread")) {
    const spread = num ?? 0;
    return {
      icon: Percent,
      tone: spread > 4 ? "warning" : spread > 2 ? "neutral" : "positive",
      trend: spread > 3 ? "up" : spread < 1.5 ? "down" : "flat",
      trendTitle:
        spread > 3
          ? t("secondaryMarket.listingDetail.spreadWide")
          : t("secondaryMarket.listingDetail.spreadTight"),
    };
  }
  if (label.includes("ликвид") || label.includes("liquid")) {
    const low = /низк|low|baja|baixa/i.test(stat.value);
    const high = /высок|high|alta/i.test(stat.value);
    return {
      icon: Signal,
      tone: high ? "positive" : low ? "warning" : "neutral",
      trend: high ? "up" : low ? "down" : "flat",
      footer: (
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full",
              high ? "w-[88%] bg-[#B7F500]/85" : low ? "w-[28%] bg-zinc-500" : "w-[55%] bg-[#B7F500]/55",
            )}
          />
        </div>
      ),
    };
  }
  if (label.includes("bid")) {
    return { icon: ArrowDown, tone: "buy", trend: null };
  }
  if (label.includes("ask")) {
    return { icon: ArrowUp, tone: "sell", trend: null };
  }
  if (label.includes("статус") || label.includes("status") || label.includes("estado")) {
    const active = /актив|active|activo/i.test(stat.value);
    return {
      icon: CheckCircle2,
      tone: active ? "positive" : "muted",
      trend: active ? "up" : "flat",
    };
  }
  return { icon: BarChart3, tone: "neutral", trend: null };
}

export function SecondaryMarketListingStatGrid({ stats }: { stats: ReleaseDetailQuickStat[] }) {
  const { t } = useI18n();
  if (stats.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const meta = statMeta(stat, t);
        return (
          <SecondaryMarketListingMetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={meta.icon}
            tone={meta.tone}
            trend={meta.trend}
            trendTitle={meta.trendTitle}
            footer={meta.footer}
          />
        );
      })}
    </div>
  );
}
