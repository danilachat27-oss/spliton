"use client";

import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { cn } from "@/lib/utils";

type AdminAnalyticsKpiGroupProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  gridClassName?: string;
  embedded?: boolean;
};

export function AdminAnalyticsKpiGroup({
  title,
  description,
  children,
  className,
  gridClassName,
  embedded = false,
}: AdminAnalyticsKpiGroupProps) {
  return (
    <section className={cn(!embedded && ADMIN_SECTION_TILE, "min-w-0 space-y-4", className)}>
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p> : null}
      </div>
      <div className={cn(ADMIN_SECTION_KPI_GRID, gridClassName)}>{children}</div>
    </section>
  );
}
