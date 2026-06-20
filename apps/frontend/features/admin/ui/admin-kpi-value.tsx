"use client";

import { ADMIN_METRIC_NA_LABEL, isAdminMetricEmpty } from "@/features/admin/lib/admin-format";
import { cn } from "@/lib/utils";

type AdminKpiValueProps = {
  value: string | number | null | undefined;
  className?: string;
  emptyLabel?: string;
};

export function AdminKpiValue({
  value,
  className,
  emptyLabel = ADMIN_METRIC_NA_LABEL,
}: AdminKpiValueProps) {
  const text = value == null ? "" : String(value);
  const empty = isAdminMetricEmpty(text);

  return (
    <p
      className={cn(
        "mt-2 tabular-nums tracking-tight",
        empty
          ? "text-base font-medium text-zinc-500"
          : "text-2xl font-semibold text-zinc-100",
        className,
      )}
    >
      {empty ? emptyLabel : text}
    </p>
  );
}
