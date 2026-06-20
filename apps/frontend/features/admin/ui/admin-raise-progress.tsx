"use client";

import { formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { cn } from "@/lib/utils";

export function raiseProgressTone(pct: number): {
  fill: string;
  glow: string;
  label: string;
} {
  if (pct >= 75) {
    return {
      fill: "bg-[#B7F500]",
      glow: "shadow-[0_0_10px_rgba(183,245,0,0.45)]",
      label: "text-[#B7F500]",
    };
  }
  if (pct >= 40) {
    return {
      fill: "bg-amber-400",
      glow: "shadow-[0_0_10px_rgba(251,191,36,0.35)]",
      label: "text-amber-400",
    };
  }
  if (pct > 0) {
    return {
      fill: "bg-red-500",
      glow: "shadow-[0_0_10px_rgba(239,68,68,0.35)]",
      label: "text-red-400",
    };
  }
  return {
    fill: "bg-zinc-600",
    glow: "",
    label: "text-zinc-500",
  };
}

type AdminRaiseProgressProps = {
  pct: number;
  raised?: string;
  target?: string;
  variant?: "table" | "inline" | "preview";
  className?: string;
};

export function AdminRaiseProgress({
  pct,
  raised,
  target,
  variant = "table",
  className,
}: AdminRaiseProgressProps) {
  const safe = Math.min(100, Math.max(0, Math.round(pct)));
  const fillWidth = safe === 0 ? 0 : Math.max(safe, 6);
  const tone = raiseProgressTone(safe);

  if (variant === "inline") {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center justify-between text-xs tabular-nums text-zinc-500">
          <span>{safe}%</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-zinc-700/90"
          role="progressbar"
          aria-valuenow={safe}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full min-w-[6px] rounded-full transition-all", tone.fill, tone.glow)}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === "preview") {
    return (
      <div className={className}>
        <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
          <span>
            Прогресс · цель {target ? formatUsdtAmount(target) : "—"}
          </span>
          <span className={cn("tabular-nums font-semibold", tone.label)}>{safe}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-zinc-700/90"
          role="progressbar"
          aria-valuenow={safe}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full min-w-[6px] rounded-full transition-all", tone.fill, tone.glow)}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
        {raised ? (
          <p className="mt-1 text-[10px] text-zinc-500">Собрано {formatUsdtAmount(raised)}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("min-w-[140px]", className)}>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-zinc-700/90"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full min-w-[6px] rounded-full transition-all", tone.fill, tone.glow)}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs tabular-nums text-zinc-400">
        {raised && target ? (
          <>
            {formatUsdtAmount(raised)} / {formatUsdtAmount(target)}
          </>
        ) : null}
        <span className={cn("font-semibold", raised && target ? "ml-1.5" : "", tone.label)}>
          {raised && target ? "· " : ""}
          {safe}% от цели
        </span>
      </p>
    </div>
  );
}