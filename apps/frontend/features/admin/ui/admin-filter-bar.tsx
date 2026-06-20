"use client";

import { Search } from "@/lib/lucide";

import { Input } from "@/components/ui/input";
import { AdminDatePicker } from "@/features/admin/ui/admin-date-picker";
import { AdminResponsiveFilters } from "@/features/admin/ui/admin-responsive-filters";
import { AdminStyledSelect } from "@/features/admin/ui/admin-styled-select";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminCard, adminFieldInput } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export type AdminFilterField = {
  id: string;
  label: string;
  type: "search" | "select" | "date";
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
};

type AdminFilterBarProps = {
  fields: AdminFilterField[];
  actions?: React.ReactNode;
  className?: string;
};

function countActiveFilterFields(fields: AdminFilterField[]) {
  return fields.filter((field) => {
    const value = field.value.trim();
    return value !== "" && value !== "all";
  }).length;
}

export function AdminFilterBar({ fields, actions, className }: AdminFilterBarProps) {
  const a = useAdminI18n();
  const activeCount = countActiveFilterFields(fields);

  const resetFilters = () => {
    fields.forEach((field) => {
      if (field.value !== "") field.onChange("");
    });
  };

  return (
    <AdminResponsiveFilters
      activeCount={activeCount}
      onReset={activeCount > 0 ? resetFilters : undefined}
      panelClassName={cn(adminCard("flex flex-wrap items-end gap-3 p-4"), className)}
    >
      {fields.map((field) => (
        <div key={field.id} className="w-full min-w-0 overflow-visible md:min-w-[140px] md:flex-1">
          <label
            htmlFor={field.id}
            className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500"
          >
            {field.label}
          </label>
          {field.type === "select" ? (
            <AdminStyledSelect
              id={field.id}
              value={field.value}
              options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) ?? []}
              onChange={field.onChange}
              fullWidth
            />
          ) : field.type === "date" ? (
            <AdminDatePicker
              id={field.id}
              value={field.value}
              onChange={field.onChange}
              aria-label={field.label}
            />
          ) : (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <Input
                id={field.id}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder ?? a.t("admin.filters.searchPlaceholder")}
                className={cn("h-9 pl-9", adminFieldInput)}
              />
            </div>
          )}
        </div>
      ))}
      {actions ? <div className="flex w-full shrink-0 items-center gap-2 pb-0.5 md:w-auto">{actions}</div> : null}
    </AdminResponsiveFilters>
  );
}
