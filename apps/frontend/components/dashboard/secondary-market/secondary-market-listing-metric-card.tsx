"use client";

import type { LucideIcon } from "@/lib/lucide";
import { ArrowDown, ArrowUp, Minus } from "@/lib/lucide";
import { cn } from "@/lib/utils";

export type ListingMetricTone = "neutral" | "positive" | "negative" | "buy" | "sell" | "muted" | "warning";

export type ListingMetricTrend = "up" | "down" | "flat" | null;

const TONE_VALUE: Record<ListingMetricTone, string> = {
  neutral: "text-white",
  positive: "text-[#B7F500]",
  negative: "text-fuchsia-300",
  buy: "text-[#d4f570]",
  sell: "text-fuchsia-200",
  muted: "text-zinc-400",
  warning: "text-amber-200",
};

const TONE_ICON_WRAP: Record<ListingMetricTone, string> = {
  neutral: "bg-white/6 text-zinc-300",
  positive: "bg-[#B7F500]/12 text-[#B7F500]",
  negative: "bg-fuchsia-500/12 text-fuchsia-300",
  buy: "bg-[#B7F500]/12 text-[#B7F500]",
  sell: "bg-fuchsia-500/12 text-fuchsia-300",
  muted: "bg-white/4 text-zinc-500",
  warning: "bg-amber-500/12 text-amber-300",
};

type Props = {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: ListingMetricTone;
  trend?: ListingMetricTrend;
  trendTitle?: string;
  footer?: React.ReactNode;
  className?: string;
};

export function SecondaryMarketListingMetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  trend = null,
  trendTitle,
  footer,
  className,
}: Props) {
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : trend === "flat" ? Minus : null;

  return (
    <div
      className={cn(
        "rounded-2xl bg-[#111111] p-4 ring-1 ring-white/10 transition-colors hover:ring-white/14",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            TONE_ICON_WRAP[tone],
          )}
          aria-hidden
        >
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
      </div>
      <p
        className={cn(
          "mt-2 flex min-w-0 items-baseline gap-1.5 font-mono text-xl font-semibold tabular-nums",
          TONE_VALUE[tone],
        )}
      >
        {TrendIcon ? (
          <span className="inline-flex shrink-0 self-center" title={trendTitle}>
            <TrendIcon className={cn("size-4", TONE_VALUE[tone])} strokeWidth={2.5} aria-hidden />
          </span>
        ) : null}
        <span className="min-w-0">{value}</span>
      </p>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
