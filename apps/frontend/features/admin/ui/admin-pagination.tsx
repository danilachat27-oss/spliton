"use client";

import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: AdminPaginationProps) {
  const a = useAdminI18n();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const rangeLabel = a
    .t("admin.pagination.range")
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(total));

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-zinc-500",
        className,
      )}
    >
      <span className="tabular-nums">{rangeLabel}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className={adminBtnOutline}
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {a.t("admin.pagination.previous")}
        </Button>
        <span className="tabular-nums text-zinc-400">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="ghost"
          className={adminBtnOutline}
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {a.t("admin.pagination.next")}
        </Button>
      </div>
    </div>
  );
}
