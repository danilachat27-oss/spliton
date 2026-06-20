"use client";

import Link from "next/link";

import type { AssetsActivity } from "@/components/dashboard/assets/assets-mock-data";
import { recentActivity } from "@/components/dashboard/assets/assets-mock-data";
import { assetsCardClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { EmptyState } from "@/components/shared/data-states/empty-state";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function RecentActivityCard({
  preview = false,
  live = false,
  items,
  loading = false,
  error = null,
  onRetry,
  variant = "default",
}: {
  preview?: boolean;
  live?: boolean;
  items?: AssetsActivity[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  variant?: "default" | "statement";
}) {
  const { t } = useI18n();
  const resolvedItems = items ?? (live ? [] : preview ? recentActivity.slice(0, 5) : recentActivity);
  const isStatement = variant === "statement";
  const sectionClass = cn(
    assetsCardClass,
    isStatement && "flex h-full min-h-0 flex-col lg:sticky lg:top-[calc(var(--assets-sticky-offset,7rem)+0.5rem)] lg:self-stretch",
  );

  if (live && loading && resolvedItems.length === 0) {
    return (
      <section className={sectionClass}>
        <div className="h-32 animate-pulse rounded-xl bg-neutral-50" />
      </section>
    );
  }

  if (live && error && resolvedItems.length === 0) {
    return (
      <section className={sectionClass}>
        <ReadOnlySectionError
          sectionId="recent-activity-card"
          error={error}
          onRetry={onRetry}
          compact
        />
      </section>
    );
  }

  const title = isStatement ? t("overview.statementTitle") : t("activity.recent.title");

  return (
    <section className={sectionClass}>
      <div
        className={cn(
          "flex gap-3",
          isStatement ? "flex-col sm:flex-row sm:items-start sm:justify-between" : "items-center justify-between",
        )}
      >
        <h3
          className={cn(
            "min-w-0 font-semibold text-neutral-900",
            isStatement ? "text-base leading-snug sm:max-w-[58%] sm:text-lg" : "text-base sm:text-lg",
          )}
        >
          {title}
        </h3>
        {preview || live ? (
          <Link
            href={ROUTES.dashboardActivity}
            className={cn(
              "shrink-0 text-sm font-medium text-neutral-500 transition hover:text-neutral-900",
              isStatement ? "whitespace-nowrap sm:pt-0.5 sm:text-right" : "",
            )}
          >
            {t("activity.recent.viewAll")}
          </Link>
        ) : null}
      </div>

      {resolvedItems.length === 0 ? (
        live ? (
          <EmptyState
            className={cn(
              "mt-3 border-0 bg-transparent p-0 ring-0",
              isStatement && "flex flex-1 flex-col justify-center",
            )}
            compact
            message={t("assets.overview.activityHistoryHint")}
          />
        ) : (
          <p className={cn("mt-3 text-sm text-neutral-500", isStatement && "flex flex-1 items-center")}>
            {t("activity.recent.empty")}
          </p>
        )
      ) : (
        <ul className="mt-3 divide-y divide-neutral-100">
          {resolvedItems.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">{item.type}</p>
                <p className="truncate text-xs text-neutral-500">{item.detail}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono font-medium tabular-nums text-neutral-900">{item.amount}</p>
                <p className="text-xs text-neutral-500">{item.date}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
