"use client";

import { Search } from "@/lib/lucide";

import { Input } from "@/components/ui/input";
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

export function AdminFilterBar({ fields, actions, className }: AdminFilterBarProps) {
  const a = useAdminI18n();
  return (
    <div className={cn(adminCard("flex flex-wrap items-end gap-3 p-4"), className)}>
      {fields.map((field) => (
        <div key={field.id} className="min-w-[140px] flex-1">
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
            <Input
              id={field.id}
              type="date"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className={cn("h-9", adminFieldInput)}
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
      {actions ? <div className="flex shrink-0 items-center gap-2 pb-0.5">{actions}</div> : null}
    </div>
  );
}
