"use client";

import type { ChartEmptyVariant } from "@/features/admin/lib/admin-analytics-i18n";
import { chartEmptyState } from "@/features/admin/lib/admin-analytics-i18n";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

type AdminChartEmptyStateProps = {
  title?: string;
  description?: string;
  variant?: ChartEmptyVariant;
};

export function AdminChartEmptyState({
  title,
  description,
  variant = "default",
}: AdminChartEmptyStateProps) {
  const { locale } = useAdminI18n();
  const preset = chartEmptyState(variant, locale);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-900/30 px-6 py-10 text-center">
      <div className="mb-3 size-10 rounded-full bg-zinc-800/80 ring-1 ring-zinc-700/60" aria-hidden />
      <p className="text-sm font-medium text-zinc-200">{title ?? preset.title}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
        {description ?? preset.description}
      </p>
    </div>
  );
}

export function AdminChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
      <div className="h-4 w-1/3 rounded bg-zinc-800" />
      <div className="h-3 w-2/3 rounded bg-zinc-800/70" />
      <div className="mt-4 h-52 rounded-lg bg-zinc-800/50" />
    </div>
  );
}
