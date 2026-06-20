import { AdminChartSkeleton } from "@/features/admin/analytics/components/admin-chart-states";
import { adminPageBg } from "@/features/admin/lib/admin-ui";

export default function AdminAnalyticsLoading() {
  return (
    <div className={`space-y-4 p-4 sm:p-6 ${adminPageBg}`}>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800/80" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-900/60 ring-1 ring-zinc-800/80" />
        ))}
      </div>
      <AdminChartSkeleton />
    </div>
  );
}