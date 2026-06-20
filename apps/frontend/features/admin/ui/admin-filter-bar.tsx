"use client";

import * as React from "react";
import { Search } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminRightWidePanel } from "@/features/admin/components/admin-right-wide-panel";
import { AdminDatePicker } from "@/features/admin/ui/admin-date-picker";
import { AdminStyledSelect } from "@/features/admin/ui/admin-styled-select";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminBtnOutline, adminFieldInput, adminFilterNumericInput, adminMetricLabel } from "@/features/admin/lib/admin-ui";
import { ADMIN_SECTION_FILTERS } from "@/features/admin/lib/admin-section-styles";
import { cn } from "@/lib/utils";

export type AdminFilterField = {
  id: string;
  label: string;
  type: "search" | "select" | "date" | "number";
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
};

type AdminFilterBarProps = {
  fields: AdminFilterField[];
  /** Подсказка под полем поиска — по каким полям ищем. */
  searchHint?: string;
  /** Дополнительные поля внутри панели фильтров (risk min/max и т.п.). */
  drawerExtra?: React.ReactNode;
  /** Элементы справа в строке поиска (счётчик «Найдено»). */
  trailing?: React.ReactNode;
  /** Доп. строка под поиском — risk min/max, счётчик и т.п. */
  footer?: React.ReactNode;
  /** Доп. активные фильтры для бейджа на кнопке (поля вне fields). */
  extraActiveCount?: number;
  /** Доп. сброс (risk min/max и т.п. вне fields). */
  onReset?: () => void;
  /** Ширина правой панели фильтров. */
  panelWidthClassName?: string;
  /** На больших экранах показывать фильтры сеткой (кнопка «Фильтры» скрыта). */
  inlineFrom?: "lg" | "xl";
  className?: string;
};

type AdminFilterNumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  className?: string;
};

type AdminFilterResultCountProps = {
  label: string;
  value: number;
  className?: string;
};

export function AdminFilterNumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  className,
}: AdminFilterNumberFieldProps) {
  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      onChange("");
      return;
    }
    let next = Number(digits);
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    onChange(String(next));
  };

  return (
    <div className={cn("flex w-[7.25rem] flex-col gap-1.5", className)}>
      <label htmlFor={id} className={adminMetricLabel}>
        {label}
      </label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="—"
        className={cn(adminFilterNumericInput, "text-center")}
      />
    </div>
  );
}

export function AdminFilterResultCount({ label, value, className }: AdminFilterResultCountProps) {
  return (
    <p className={cn("text-center text-xs text-zinc-500", className)}>
      {label}:{" "}
      <span className="font-semibold tabular-nums text-zinc-200">{value}</span>
    </p>
  );
}

export type AdminFilterPillOption = {
  value: string;
  label: string;
};

type AdminFilterPillsProps = {
  label?: string;
  value: string;
  options: AdminFilterPillOption[];
  onChange: (value: string) => void;
  className?: string;
};

export function AdminFilterPills({
  label,
  value,
  options,
  onChange,
  className,
}: AdminFilterPillsProps) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      {label ? (
        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          {label}
        </span>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-[#B7F500]/15 text-[#B7F500] ring-1 ring-[#B7F500]/35"
                  : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function countActiveFilterFields(fields: AdminFilterField[]) {
  return fields.filter((field) => {
    if (field.type === "search" || field.type === "number") return false;
    const value = field.value.trim();
    return value !== "" && value !== "all";
  }).length;
}

function isInlineFilterField(field: AdminFilterField) {
  return field.type === "search" || field.type === "number";
}

function FilterFieldControl({ field, large }: { field: AdminFilterField; large?: boolean }) {
  const a = useAdminI18n();

  if (field.type === "select") {
    return (
      <AdminStyledSelect
        id={field.id}
        value={field.value}
        options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) ?? []}
        onChange={field.onChange}
        fullWidth
        size={large ? "md" : "md"}
        className="min-w-[220px]"
      />
    );
  }

  if (field.type === "date") {
    return (
      <AdminDatePicker
        id={field.id}
        value={field.value}
        onChange={field.onChange}
        aria-label={field.label}
        className={large ? "h-10" : undefined}
      />
    );
  }

  if (field.type === "number") {
    return (
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <Input
          id={field.id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={field.value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            field.onChange(digits);
          }}
          placeholder={field.placeholder ?? "—"}
          className={cn(large ? "h-10 pl-9 text-sm tabular-nums" : "h-9 pl-9 tabular-nums", adminFieldInput)}
        />
      </div>
    );
  }

  return (
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
        className={cn(large ? "h-10 pl-9 text-sm" : "h-9 pl-9", adminFieldInput)}
      />
    </div>
  );
}

function FilterFieldBlock({
  field,
  large,
}: {
  field: AdminFilterField;
  large?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={field.id}
        className={cn(
          "mb-1.5 block font-medium uppercase tracking-wide text-zinc-500",
          large ? "text-xs" : "text-[11px]",
        )}
      >
        {field.label}
      </label>
      <FilterFieldControl field={field} large={large} />
    </div>
  );
}

export function AdminFilterBar({
  fields,
  searchHint,
  drawerExtra,
  trailing,
  footer,
  extraActiveCount = 0,
  onReset,
  panelWidthClassName = "w-[min(100vw-1rem,520px)]",
  inlineFrom,
  className,
}: AdminFilterBarProps) {
  const a = useAdminI18n();
  const [open, setOpen] = React.useState(false);
  const searchFields = fields.filter(isInlineFilterField);
  const filterFields = fields.filter((field) => !isInlineFilterField(field));
  const activeCount = countActiveFilterFields(fields) + extraActiveCount;
  const inlineHideBtn = inlineFrom === "xl" ? "xl:hidden" : inlineFrom === "lg" ? "lg:hidden" : "";
  const inlineShowGrid =
    inlineFrom === "xl"
      ? "hidden xl:grid xl:grid-cols-2 xl:gap-4 2xl:grid-cols-3"
      : inlineFrom === "lg"
        ? "hidden lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3"
        : "";

  const resetFilters = () => {
    filterFields.forEach((field) => {
      if (field.value !== "" && field.value !== "all") {
        field.onChange(field.type === "select" ? "all" : "");
      }
    });
    onReset?.();
  };

  const showFilterButton = filterFields.length > 0 || Boolean(drawerExtra);
  const filterButton = showFilterButton ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        adminBtnOutline,
        "h-9 shrink-0 px-3.5 text-xs font-semibold",
        inlineHideBtn,
      )}
      aria-label={a.t("admin.filters.openAria")}
      aria-expanded={open}
      onClick={() => setOpen(true)}
    >
      {a.t("admin.filters.title")}
      {activeCount > 0 ? (
        <span className="ml-1.5 tabular-nums text-[#B7F500]">{activeCount > 9 ? "9+" : activeCount}</span>
      ) : null}
    </Button>
  ) : null;

  return (
    <div className={cn("space-y-3", className)}>
      {searchFields.length > 0 ? (
        <div className="space-y-3">
          {searchFields.map((field, index) => (
            <div key={field.id} className="min-w-0">
              <label
                htmlFor={field.id}
                className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500"
              >
                {field.label}
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <FilterFieldControl field={field} large={Boolean(inlineFrom)} />
                </div>
                {index === 0 ? filterButton : null}
                {index === 0 && trailing ? <div className="shrink-0">{trailing}</div> : null}
              </div>
            </div>
          ))}
          {searchHint ? (
            <p className="text-xs leading-relaxed text-zinc-500">{searchHint}</p>
          ) : null}
        </div>
      ) : null}

      {searchFields.length === 0 && showFilterButton ? (
        <div className={cn("flex flex-wrap items-center justify-end gap-2", inlineHideBtn)}>
          {filterButton}
          {trailing}
        </div>
      ) : null}

      {inlineFrom && filterFields.length > 0 ? (
        <div className={cn(ADMIN_SECTION_FILTERS, inlineShowGrid, "!p-5 sm:!px-8 sm:!py-6")}>
          {filterFields.map((field) => (
            <FilterFieldBlock key={field.id} field={field} large />
          ))}
          {activeCount > 0 ? (
            <div className="flex items-end lg:col-span-2 xl:col-span-1 2xl:col-span-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(adminBtnOutline, "h-10 w-full")}
                onClick={resetFilters}
              >
                {a.t("admin.filters.reset")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {footer ? (
        <div className="rounded-2xl bg-zinc-900/40 px-5 py-4 sm:px-8 sm:py-4">{footer}</div>
      ) : null}

      <AdminRightWidePanel
        open={open}
        onOpenChange={setOpen}
        title={a.t("admin.filters.title")}
        description={a.t("admin.filters.panelDescription")}
        widthClassName={panelWidthClassName}
        headerActions={
          filterFields.length > 0 || drawerExtra ? (
            <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={resetFilters}>
              {a.t("admin.filters.reset")}
            </Button>
          ) : null
        }
      >
        <div className="flex flex-col gap-6">
          {filterFields.map((field) => (
            <FilterFieldBlock key={field.id} field={field} large />
          ))}
          {drawerExtra}
          <Button type="button" className="mt-1 h-11 w-full text-sm font-semibold" onClick={() => setOpen(false)}>
            {a.t("admin.filters.apply")}
          </Button>
        </div>
      </AdminRightWidePanel>
    </div>
  );
}
