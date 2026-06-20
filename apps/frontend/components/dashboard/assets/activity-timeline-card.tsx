"use client";

import type { ActivityRecord, ActivityStatus } from "@/components/dashboard/assets/activity-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";

const statusTone: Record<ActivityRecord["status"], string> = {
  Completed: "border-blue-100 bg-blue-50 text-blue-800",
  Pending: "border-neutral-200 bg-white text-neutral-700",
  Processing: "border-neutral-200 bg-white text-neutral-700",
  Cancelled: "border-neutral-200 bg-neutral-50 text-neutral-500",
};

function activityTypeLabel(row: ActivityRecord, t: (key: string) => string) {
  return row.typeKey ? t(`activity.widgets.type.${row.typeKey}`) : (row.type ?? "");
}

function activityDetailsLabel(row: ActivityRecord, t: (key: string) => string) {
  return row.detailsKey ? t(`activity.widgets.details.${row.detailsKey}`) : (row.details ?? "");
}

function activityRelativeLabel(row: ActivityRecord, t: (key: string) => string) {
  return row.relativeKey ? t(`activity.widgets.relative.${row.relativeKey}`) : (row.relative ?? "");
}

const STATUS_KEYS: Record<ActivityStatus, string> = {
  Completed: "activity.widgets.status.completed",
  Pending: "activity.widgets.status.pending",
  Processing: "activity.widgets.status.processing",
  Cancelled: "activity.widgets.status.cancelled",
};

export function ActivityTimelineCard({ rows }: { rows: ActivityRecord[] }) {
  const { t } = useI18n();

  return (
    <section className="space-y-5 rounded-3xl bg-white px-5 py-6 sm:space-y-6 sm:px-7 sm:py-8" aria-label={t("activity.widgets.timelineAria")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Activity · Feed</p>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">{t("activity.widgets.timelineTitle")}</h3>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Live</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-neutral-50/90 px-4 py-6 text-center ring-1 ring-neutral-100">
          <p className="text-sm font-semibold text-neutral-900">{t("activity.widgets.timelineEmptyTitle")}</p>
          <p className="mt-1 text-xs text-neutral-500">{t("activity.widgets.timelineEmptyBody")}</p>
        </div>
      ) : (
        <div className="relative">
          <span className="absolute left-[60px] top-3 h-[calc(100%-18px)] w-px bg-neutral-200" aria-hidden />
          {rows.slice(0, 5).map((row) => (
            <div key={row.id} className="group relative grid grid-cols-[52px_16px_minmax(0,1fr)] items-start gap-2 pb-3 last:pb-0">
              <div className="pt-0.5 text-right">
                <p className="text-[11px] font-medium text-neutral-700">{activityRelativeLabel(row, t)}</p>
                <p className="text-[10px] text-neutral-500">{row.date.split(" ")[0]}</p>
              </div>

              <div className="relative flex justify-center pt-1">
                <span className="relative z-1 inline-block size-2.5 shrink-0 rounded-full border border-white bg-neutral-900" aria-hidden />
              </div>

              <span className="pointer-events-none absolute left-[78px] top-0 -translate-y-1/2 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-600 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                {row.date}
              </span>

              <div className="min-w-0 rounded-xl bg-neutral-50/90 px-3 py-2.5 ring-1 ring-neutral-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-neutral-900">{activityTypeLabel(row, t)}</p>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone[row.status]}`}>
                    {t(STATUS_KEYS[row.status])}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-600">
                  {row.release !== "—" ? `${row.release} · ` : ""}
                  {activityDetailsLabel(row, t)}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                  <span>{row.amount}</span>
                  <span>{activityRelativeLabel(row, t)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
