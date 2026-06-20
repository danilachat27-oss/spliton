"use client";

import {
  ExchangeNeonSparkline,
  type ExchangeNeonTrend,
} from "@/components/shared/charts/exchange-neon-sparkline";
import { cn } from "@/lib/utils";

export function CatalogTrackCardChart({
  values,
  trend,
  className,
  height = 56,
}: {
  values: number[];
  trend: ExchangeNeonTrend;
  className?: string;
  height?: number;
}) {
  return (
    <ExchangeNeonSparkline
      values={values}
      trend={trend}
      width={280}
      height={height}
      fitContainer
      detailSegments={6}
      className={cn("h-full w-full", className)}
    />
  );
}
