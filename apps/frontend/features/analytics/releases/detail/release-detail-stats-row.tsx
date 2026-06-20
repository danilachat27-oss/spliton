import type { ReleaseDetailPageData, ReleaseDetailQuickStat } from "@/types/analytics/release-detail";
import { filterMetricRows } from "@/lib/analytics/display-value";

import { ReleaseDetailKpiFlipCard } from "./release-detail-kpi-flip-card";

export function ReleaseDetailStatsRow({
  data,
  stats,
}: {
  data: ReleaseDetailPageData;
  /** Если задано — показываем только эти метрики (например компактная сводка на странице лота). */
  stats?: ReleaseDetailQuickStat[];
}) {
  const items = filterMetricRows(stats ?? data.quickStats);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((s) => (
        <ReleaseDetailKpiFlipCard key={s.label} stat={s} />
      ))}
    </div>
  );
}
