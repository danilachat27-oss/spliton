"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

type AdminDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  /** e.g. w-[min(1120px,100vw)] for complex forms */
  widthClassName?: string;
};

export function AdminDetailDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  wide,
  widthClassName,
}: AdminDetailDrawerProps) {
  const a = useAdminI18n();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[1px]" />
        <Dialog.Popup
          className={cn(
            "admin-portal fixed inset-y-0 right-0 z-[70] flex max-h-[100dvh] flex-col bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/40",
            wide ? widthClassName ?? "w-[min(720px,100vw)]" : widthClassName ?? "w-[min(480px,100vw)]",
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800/80 px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-zinc-100">{title}</Dialog.Title>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
              ) : null}
            </div>
            <Dialog.Close
              className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={a.t("admin.ui.close")}
            >
              <X className="size-5" />
            </Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain revshare-scrollbar px-5 py-4">
            {children}
          </div>
          {footer ? (
            <footer className="shrink-0 border-t border-zinc-800/80 bg-zinc-950 px-5 py-4">{footer}</footer>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
