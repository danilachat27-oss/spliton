"use client";

import { AdminDatePicker } from "@/features/admin/ui/admin-date-picker";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  adminPeriodSelectorActive,
  adminPeriodSelectorIdle,
  adminPeriodSelectorShell,
} from "@/features/admin/analytics/lib/admin-analytics-theme";
import { cn } from "@/lib/utils";
import type { AnalyticsPeriodKey } from "@/features/admin/analytics/types";

const PERIOD_IDS: AnalyticsPeriodKey[] = ["24h", "7d", "30d", "90d", "custom"];

type AdminPeriodSelectorProps = {
  value: AnalyticsPeriodKey;
  onChange: (period: AnalyticsPeriodKey) => void;
  customFrom?: string;
  customTo?: string;
  onCustomDatesChange?: (from: string, to: string) => void;
  className?: string;
};

export function AdminPeriodSelector({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomDatesChange,
  className,
}: AdminPeriodSelectorProps) {
  const a = useAdminI18n();

  const periods = PERIOD_IDS.map((id) => ({
    id,
    label: a.t(`admin.analytics.period.${id}`),
  }));

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>
      <div
        className={adminPeriodSelectorShell}
        role="tablist"
        aria-label={a.t("admin.analytics.period.ariaLabel")}
      >
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={value === p.id}
            onClick={() => onChange(p.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
              value === p.id ? adminPeriodSelectorActive : adminPeriodSelectorIdle,
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value === "custom" && onCustomDatesChange ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[148px]">
            <span className="mb-1 block text-[11px] text-zinc-500">{a.t("admin.analytics.period.from")}</span>
            <AdminDatePicker
              value={customFrom ?? ""}
              onChange={(from) => onCustomDatesChange(from, customTo ?? from)}
              className="!h-8 text-xs"
            />
          </div>
          <div className="min-w-[148px]">
            <span className="mb-1 block text-[11px] text-zinc-500">{a.t("admin.analytics.period.to")}</span>
            <AdminDatePicker
              value={customTo ?? ""}
              onChange={(to) => onCustomDatesChange(customFrom ?? to, to)}
              className="!h-8 text-xs"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
