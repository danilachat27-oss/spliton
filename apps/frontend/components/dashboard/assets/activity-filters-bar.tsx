"use client";

import { Search, SlidersHorizontal } from "@/lib/lucide";
import { useMemo, useState } from "react";

import { AssetsFilterField, AssetsFilterSelect } from "@/components/dashboard/assets/assets-filter-field";
import { AssetsUnderlineTabs } from "@/components/dashboard/assets/assets-underline-tabs";
import { assetsFilterInputClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type ActivityFilterTab = "all" | "deposits" | "buys" | "sells" | "transfers" | "withdrawals";

export const ACTIVITY_PERIOD_7D = "7d";
export const ACTIVITY_PERIOD_30D = "30d";
export const ACTIVITY_PERIOD_90D = "90d";
export const ACTIVITY_PERIOD_180D = "180d";
export const ACTIVITY_PERIOD_1Y = "1y";
export const ACTIVITY_PERIOD_ALL = "all";
export const ACTIVITY_RELEASE_ALL = "__all__";
export const ACTIVITY_STATUS_ALL = "__all__";
export const ACTIVITY_DIRECTION_ALL = "all";

const STATUS_VALUES = ["Completed", "Pending", "Processing", "Cancelled"] as const;

export function ActivityFiltersBar({
  activeTab,
  onTabChange,
  period,
  onPeriodChange,
  release,
  onReleaseChange,
  releaseOptions = [],
  status,
  onStatusChange,
  direction,
  onDirectionChange,
  sort,
  onSortChange,
  query,
  onQueryChange,
  disabled,
}: {
  activeTab: ActivityFilterTab;
  onTabChange: (tab: ActivityFilterTab) => void;
  period: string;
  onPeriodChange: (value: string) => void;
  release: string;
  onReleaseChange: (value: string) => void;
  releaseOptions?: { id: string; title: string }[];
  status: string;
  onStatusChange: (value: string) => void;
  direction: string;
  onDirectionChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const tabs = useMemo(
    () =>
      (
        [
          { id: "all", labelKey: "activity.tab.all" },
          { id: "deposits", labelKey: "activity.tab.deposits" },
          { id: "buys", labelKey: "activity.tab.buys" },
          { id: "sells", labelKey: "activity.tab.sells" },
          { id: "transfers", labelKey: "activity.tab.transfers" },
          { id: "withdrawals", labelKey: "activity.tab.withdrawals" },
        ] as const
      ).map((tab) => ({ id: tab.id, label: t(tab.labelKey) })),
    [t],
  );

  const periodOptions = useMemo(
    () => [
      { value: ACTIVITY_PERIOD_7D, label: t("activity.period.7d") },
      { value: ACTIVITY_PERIOD_30D, label: t("activity.period.30d") },
      { value: ACTIVITY_PERIOD_90D, label: t("activity.period.90d") },
      { value: ACTIVITY_PERIOD_180D, label: t("activity.period.180d") },
      { value: ACTIVITY_PERIOD_1Y, label: t("activity.period.1y") },
      { value: ACTIVITY_PERIOD_ALL, label: t("activity.period.all") },
    ],
    [t],
  );

  const releaseFilterOptions = useMemo(
    () => [
      { value: ACTIVITY_RELEASE_ALL, label: t("activity.filterAllReleases") },
      ...releaseOptions.map((r) => ({ value: r.id, label: r.title })),
    ],
    [releaseOptions, t],
  );

  const statusOptions = useMemo(
    () => [
      { value: ACTIVITY_STATUS_ALL, label: t("activity.filterAllStatuses") },
      ...STATUS_VALUES.map((v) => ({
        value: v,
        label: t(`activity.widgets.status.${v.toLowerCase()}`),
      })),
    ],
    [t],
  );

  const directionOptions = useMemo(
    () => [
      { value: ACTIVITY_DIRECTION_ALL, label: t("activity.direction.all") },
      { value: "in", label: t("activity.direction.in") },
      { value: "out", label: t("activity.direction.out") },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: "newest", label: t("activity.sort.newest") },
      { value: "oldest", label: t("activity.sort.oldest") },
      { value: "amount_desc", label: t("activity.sort.amountDesc") },
      { value: "amount_asc", label: t("activity.sort.amountAsc") },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <AssetsUnderlineTabs
        value={activeTab}
        onChange={onTabChange}
        items={tabs}
        disabled={disabled}
        ariaLabel={t("activity.filters.tabsAria")}
      />

      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <AssetsFilterField label={t("activity.filters.dateLabel")} className="sm:min-w-[10rem]">
          <AssetsFilterSelect
            value={period}
            options={periodOptions}
            onSelect={onPeriodChange}
            disabled={disabled}
          />
        </AssetsFilterField>

        <AssetsFilterField label={t("activity.filters.releaseLabel")}>
          <AssetsFilterSelect
            value={release}
            options={releaseFilterOptions}
            onSelect={onReleaseChange}
            disabled={disabled}
          />
        </AssetsFilterField>

        <AssetsFilterField label={t("activity.filters.statusLabel")} className="hidden sm:block">
          <AssetsFilterSelect value={status} options={statusOptions} onSelect={onStatusChange} disabled={disabled} />
        </AssetsFilterField>

        <AssetsFilterField label={t("activity.searchPlaceholder")} className="min-w-[12rem] flex-[1.4]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              disabled={disabled}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t("activity.searchPlaceholder")}
              className={cn(assetsFilterInputClass, "pl-9")}
            />
          </div>
        </AssetsFilterField>

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="mb-0.5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200/70 sm:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("activity.filters.more")}
        </button>
      </div>

      <div className={cn("flex flex-wrap items-end gap-3 sm:gap-4", !advancedOpen && "hidden sm:flex")}>
        <AssetsFilterField label={t("activity.filters.statusLabel")} className="sm:hidden">
          <AssetsFilterSelect value={status} options={statusOptions} onSelect={onStatusChange} disabled={disabled} />
        </AssetsFilterField>
        <AssetsFilterField label={t("activity.filters.directionLabel")}>
          <AssetsFilterSelect
            value={direction}
            options={directionOptions}
            onSelect={onDirectionChange}
            disabled={disabled}
          />
        </AssetsFilterField>
        <AssetsFilterField label={t("activity.filters.sortLabel")}>
          <AssetsFilterSelect value={sort} options={sortOptions} onSelect={onSortChange} disabled={disabled} />
        </AssetsFilterField>
      </div>
    </div>
  );
}
