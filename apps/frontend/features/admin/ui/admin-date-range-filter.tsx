"use client";

import { AdminDatePicker } from "@/features/admin/ui/admin-date-picker";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

export type AdminDateRange = {
  from: string;
  to: string;
};

type AdminDateRangeFilterProps = {
  value: AdminDateRange;
  onChange: (value: AdminDateRange) => void;
  className?: string;
};

export function AdminDateRangeFilter({
  value,
  onChange,
  className,
}: AdminDateRangeFilterProps) {
  const a = useAdminI18n();

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {a.t("admin.datePicker.from")}
        </label>
        <AdminDatePicker
          id="admin-date-from"
          value={value.from}
          onChange={(from) => onChange({ ...value, from })}
          aria-label={a.t("admin.datePicker.from")}
        />
      </div>
      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {a.t("admin.datePicker.to")}
        </label>
        <AdminDatePicker
          id="admin-date-to"
          value={value.to}
          onChange={(to) => onChange({ ...value, to })}
          aria-label={a.t("admin.datePicker.to")}
        />
      </div>
    </div>
  );
}
