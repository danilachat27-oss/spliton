"use client";

import { MoreHorizontal } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminDropdownPanel } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export type AdminActionItem = {
  id: string;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type AdminActionMenuProps = {
  items: AdminActionItem[];
  className?: string;
};

/** Простое выпадающее меню действий (без внешнего dropdown-пакета). */
export function AdminActionMenu({ items, className }: AdminActionMenuProps) {
  const a = useAdminI18n();

  return (
    <details className={cn("relative inline-block", className)}>
      <summary className="list-none [&::-webkit-details-marker]:hidden">
        <Button type="button" variant="ghost" size="icon-sm" aria-label={a.table.actions}>
          <MoreHorizontal className="size-4" />
        </Button>
      </summary>
      <div className={cn("absolute right-0 z-20 mt-1 min-w-[180px] py-1 shadow-lg", adminDropdownPanel)}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            onClick={(e) => {
              e.preventDefault();
              item.onClick();
              (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute(
                "open",
              );
            }}
            className={cn(
              "block w-full px-3 py-2 text-left text-sm disabled:opacity-40",
              item.destructive
                ? "text-red-400 hover:bg-red-950/40"
                : "text-zinc-200 hover:bg-zinc-800/80",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}
