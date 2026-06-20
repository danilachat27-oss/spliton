"use client";

import { cn } from "@/lib/utils";

export function formatOrderBookUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 4,
    maximumFractionDigits: 4,
  });
}

export function OrderBookRow({
  price,
  units,
  cumulativeUsdt,
  depthMax,
  variant,
  onPick,
  compact,
  className,
  targetMarker,
}: {
  price: number;
  units: number;
  cumulativeUsdt: number;
  depthMax: number;
  variant: "ask" | "bid";
  onPick?: () => void;
  compact?: boolean;
  className?: string;
  targetMarker?: boolean;
}) {
  const pct = Math.min(100, (units / depthMax) * 100);
  const isAsk = variant === "ask";

  return (
    <button
      type="button"
      onClick={onPick}
      data-journey-target={targetMarker ? "book" : undefined}
      className={cn(
        "relative w-full text-left font-mono tabular-nums transition-colors",
        onPick ? "cursor-pointer hover:bg-white/4" : "cursor-default",
        compact ? "text-[10px]" : "text-[11px] sm:text-[12px]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 opacity-[0.16]",
          isAsk ? "right-0 rounded-l-sm bg-fuchsia-400" : "right-0 rounded-l-sm bg-[#B7F500]",
        )}
        style={{ width: `${pct}%` }}
      />
      <div
        className={cn(
          "relative grid grid-cols-[1fr_56px_80px] items-center gap-1 px-2",
          compact ? "py-px" : "py-0.5 sm:py-1",
        )}
      >
        <span className={cn(isAsk ? "text-fuchsia-200" : "text-[#c8f06a]")}>{formatOrderBookUsdt(price)}</span>
        <span className="text-center text-zinc-400">{units.toLocaleString("ru-RU")}</span>
        <span className="text-right text-zinc-600">{formatOrderBookUsdt(cumulativeUsdt)}</span>
      </div>
    </button>
  );
}
