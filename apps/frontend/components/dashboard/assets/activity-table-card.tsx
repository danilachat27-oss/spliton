"use client";

import type { ActivityRecord, ActivityStatus } from "@/components/dashboard/assets/activity-mock-data";
import { assetsCardClass, assetsTableCellClass, assetsTableHeadClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const statusStyles: Record<ActivityStatus, string> = {
  Completed: "text-[#3d7a00]",
  Pending: "text-neutral-600",
  Processing: "text-neutral-600",
  Cancelled: "text-neutral-400",
};

function activityTypeLabel(row: ActivityRecord, t: (key: string) => string) {
  return row.typeKey ? t(`activity.widgets.type.${row.typeKey}`) : (row.type ?? "");
}

function activityDetailsLabel(row: ActivityRecord, t: (key: string) => string) {
  return row.detailsKey ? t(`activity.widgets.details.${row.detailsKey}`) : (row.details ?? "");
}

const STATUS_KEYS: Record<ActivityStatus, string> = {
  Completed: "activity.widgets.status.completed",
  Pending: "activity.widgets.status.pending",
  Processing: "activity.widgets.status.processing",
  Cancelled: "activity.widgets.status.cancelled",
};

export function ActivityTableCard({
  rows,
  state,
  compact = false,
}: {
  rows: ActivityRecord[];
  state: "default" | "empty" | "loading";
  compact?: boolean;
}) {
  const { t } = useI18n();

  return (
    <section className={cn(assetsCardClass, compact && "py-4")} aria-label={t("activity.widgets.historyAria")}>
      {!compact ? (
        <h3 className="mb-4 text-base font-semibold text-neutral-900">{t("activity.widgets.historyTitle")}</h3>
      ) : null}

      {state === "loading" ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      ) : state === "empty" ? (
        <div className="py-10 text-center">
          <p className="text-base font-semibold text-neutral-900">{t("activity.emptyTitle")}</p>
          <p className="mt-1 text-sm text-neutral-500">{t("activity.emptyBody")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr>
                <th className={assetsTableHeadClass}>{t("activity.widgets.tableDate")}</th>
                <th className={assetsTableHeadClass}>{t("activity.widgets.tableType")}</th>
                <th className={assetsTableHeadClass}>{t("activity.widgets.tableRelease")}</th>
                <th className={assetsTableHeadClass}>{t("activity.widgets.tableAmount")}</th>
                <th className={assetsTableHeadClass}>{t("activity.widgets.tableStatus")}</th>
                <th className={assetsTableHeadClass}>{t("activity.widgets.tableDetails")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50/80">
                  <td className={cn(assetsTableCellClass, "text-neutral-600")}>{row.date}</td>
                  <td className={cn(assetsTableCellClass, "font-medium text-neutral-900")}>{activityTypeLabel(row, t)}</td>
                  <td className={cn(assetsTableCellClass, "text-neutral-700")}>{row.release}</td>
                  <td className={cn(assetsTableCellClass, "font-mono font-medium tabular-nums text-neutral-900")}>{row.amount}</td>
                  <td className={cn(assetsTableCellClass, statusStyles[row.status])}>{t(STATUS_KEYS[row.status])}</td>
                  <td className={cn(assetsTableCellClass, "text-neutral-600")}>{activityDetailsLabel(row, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
