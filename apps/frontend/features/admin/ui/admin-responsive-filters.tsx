"use client";

import * as React from "react";
import { SlidersHorizontal } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminBtnOutline, adminHeaderIconBtn } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminResponsiveFiltersProps = {
  children: React.ReactNode;
  activeCount?: number;
  onReset?: () => void;
  className?: string;
  panelClassName?: string;
};

export function AdminResponsiveFilters({
  children,
  activeCount = 0,
  onReset,
  className,
  panelClassName,
}: AdminResponsiveFiltersProps) {
  const a = useAdminI18n();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-end md:hidden">
        <button
          type="button"
          className={cn(adminHeaderIconBtn, "relative size-10")}
          aria-label={a.t("admin.filters.openAria")}
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal className="size-4.5" aria-hidden />
          {activeCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#B7F500] text-[10px] font-bold text-zinc-950">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className={cn("hidden md:block", panelClassName)}>{children}</div>

      {open ? (
        <div className="fixed inset-0 z-[200] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label={a.t("admin.ui.close")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-3xl bg-zinc-950 shadow-2xl">
            <div className="flex shrink-0 flex-col items-center pt-2.5 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-700" aria-hidden />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <p className="text-base font-semibold text-zinc-100">{a.t("admin.filters.title")}</p>
                {activeCount > 0 ? (
                  <p className="text-[11px] text-zinc-500">
                    {a.t("admin.filters.activeCount").replace("{count}", String(activeCount))}
                  </p>
                ) : null}
              </div>
              {onReset ? (
                <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={onReset}>
                  {a.t("admin.filters.reset")}
                </Button>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2 revshare-scrollbar">
              <div className="flex flex-col gap-4 pb-2">{children}</div>
            </div>
            <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button type="button" className="h-11 w-full" onClick={() => setOpen(false)}>
                {a.t("admin.filters.apply")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
