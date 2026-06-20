"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

type AdminRightWidePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Если нет — для скринридеров используется заголовок. */
  description?: string;
  /** Элементы справа от заголовка (например зум графика), перед кнопкой закрытия. */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  /** Ширина панели (по умолчанию широкая колонка справа). */
  widthClassName?: string;
};

/**
 * Панель админки: выезжает справа, без рамок, на весь экран по высоте.
 * Используйте для графиков, деталей сущностей и прочих «модалок» в консоли.
 */
export function AdminRightWidePanel({
  open,
  onOpenChange,
  title,
  description,
  headerActions,
  children,
  widthClassName = "w-[min(100vw-1rem,820px)]",
}: AdminRightWidePanelProps) {
  const a = useAdminI18n();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-100 bg-black/55",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "admin-portal fixed inset-y-0 right-0 z-101 flex max-h-dvh flex-col bg-zinc-950",
            widthClassName,
            "max-w-[100vw]",
            "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "data-ending-style:translate-x-full data-starting-style:translate-x-full",
          )}
        >
          <div className="flex shrink-0 flex-wrap items-start gap-3 px-5 py-4 sm:gap-4 sm:px-6">
            <div className="min-w-0 flex-1 basis-[min(100%,280px)]">
              <Dialog.Title className="text-base font-semibold tracking-tight text-zinc-100">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-zinc-500">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {headerActions}
              <Dialog.Close
                aria-label={a.t("admin.ui.close")}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-900/90 hover:text-zinc-100"
              >
                <X className="size-4" strokeWidth={1.75} aria-hidden />
              </Dialog.Close>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain revshare-scrollbar px-5 pb-6 sm:px-6">
            {children}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
