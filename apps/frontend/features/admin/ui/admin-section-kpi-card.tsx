"use client";

import type { AdminMetricActiveTone } from "@/features/admin/analytics/components/admin-metric-trend-card";
import { adminTile } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminSectionKpiCardProps = {
  label: string;
  value: number | string;
  activeTone?: AdminMetricActiveTone;
  hint?: string;
  className?: string;
};

function parseMetricValue(value: number | string): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/\s/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveValueTone(value: number | string, activeTone: AdminMetricActiveTone) {
  const num = parseMetricValue(value);
  const hasAttention = num !== null && num > 0 && activeTone !== "neutral";
  if (!hasAttention) return "text-zinc-100";
  if (activeTone === "danger") return "text-rose-400";
  if (activeTone === "success") return "text-[#B7F500]";
  if (activeTone === "info") return "text-sky-400";
  if (activeTone === "warning") return "text-amber-400";
  return "text-zinc-100";
}

function resolveAccentSurface(value: number | string, activeTone: AdminMetricActiveTone) {
  const num = parseMetricValue(value);
  if (num === null || num <= 0 || activeTone === "neutral") return null;
  if (activeTone === "danger") return "bg-rose-500/[0.05] ring-1 ring-inset ring-rose-500/20";
  if (activeTone === "success") return "bg-[#B7F500]/[0.06] ring-1 ring-inset ring-[#B7F500]/25";
  if (activeTone === "warning") return "bg-amber-500/[0.05] ring-1 ring-inset ring-amber-500/20";
  if (activeTone === "info") return "bg-sky-500/[0.05] ring-1 ring-inset ring-sky-500/20";
  return null;
}

export function AdminSectionKpiCard({
  label,
  value,
  activeTone = "neutral",
  hint,
  className,
}: AdminSectionKpiCardProps) {
  return (
    <div
      className={cn(
        adminTile,
        "flex h-full min-w-0 flex-col px-4 py-4 sm:px-5 sm:py-5",
        resolveAccentSurface(value, activeTone),
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tabular-nums tracking-tight sm:text-[1.75rem]",
          resolveValueTone(value, activeTone),
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">{hint}</p>
      ) : (
        <span className="mt-2 block min-h-4 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function AdminSectionKpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(adminTile, "h-[7.25rem] animate-pulse bg-zinc-800/50 px-4 py-4 sm:px-5 sm:py-5", className)}
      aria-hidden
    />
  );
}
