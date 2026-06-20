"use client";

import { cn } from "@/lib/utils";

export type AnalyticsMetricStatus = "good" | "neutral" | "bad" | "warning";

const TONE_CLASS: Record<AnalyticsMetricStatus, string> = {
  good: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  neutral: "bg-blue-50 text-blue-800 ring-blue-200/60",
  bad: "bg-rose-50 text-rose-800 ring-rose-200/60",
  warning: "bg-amber-50 text-amber-900 ring-amber-200/60",
};

type Props = {
  status: AnalyticsMetricStatus;
  label: string;
  className?: string;
};

export function AdminAnalyticsStatusBadge({ status, label, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASS[status],
        className,
      )}
    >
      {label}
    </span>
  );
}

export function deltaStatus(deltaPct: number | null | undefined): AnalyticsMetricStatus {
  if (deltaPct == null) return "neutral";
  if (deltaPct > 0) return "good";
  if (deltaPct < 0) return "bad";
  return "neutral";
}

export function netFlowStatus(net: number): AnalyticsMetricStatus {
  if (net > 0) return "good";
  if (net < 0) return "bad";
  return "neutral";
}
