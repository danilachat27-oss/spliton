"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
  AdminDrawerPrimaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { AdminFormFooterActions } from "@/features/admin/ui/admin-form-footer";
import { adminDialogPanel } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  closeOnConfirm?: boolean;
  confirming?: boolean;
};

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  variant = "default",
  onConfirm,
  closeOnConfirm = true,
  confirming = false,
}: AdminConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !confirming && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-[90] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            adminDialogPanel,
          )}
        >
          <Dialog.Title className="text-base font-semibold text-zinc-100">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-zinc-400">
            {description}
          </Dialog.Description>
          <AdminFormFooterActions className="mt-6">
            <AdminDrawerCancelButton disabled={confirming} onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </AdminDrawerCancelButton>
            {variant === "destructive" ? (
              <AdminDrawerDangerButton
                disabled={confirming}
                onClick={() => {
                  void (async () => {
                    await onConfirm();
                    if (closeOnConfirm) onOpenChange(false);
                  })();
                }}
              >
                {confirmLabel}
              </AdminDrawerDangerButton>
            ) : (
              <AdminDrawerPrimaryButton
                disabled={confirming}
                onClick={() => {
                  void (async () => {
                    await onConfirm();
                    if (closeOnConfirm) onOpenChange(false);
                  })();
                }}
              >
                {confirmLabel}
              </AdminDrawerPrimaryButton>
            )}
          </AdminFormFooterActions>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
