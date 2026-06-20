"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
  AdminDrawerPrimaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminFormFooterActions } from "@/features/admin/ui/admin-form-footer";
import { adminDialogPanel, adminFieldInput } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminPhraseConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmPhrase: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  confirming?: boolean;
  closeOnConfirm?: boolean;
  children?: React.ReactNode;
};

export function AdminPhraseConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmPhrase,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  variant = "default",
  onConfirm,
  confirming = false,
  closeOnConfirm = true,
  children,
}: AdminPhraseConfirmDialogProps) {
  const [phrase, setPhrase] = React.useState("");

  React.useEffect(() => {
    if (open) setPhrase("");
  }, [open]);

  const phraseOk = phrase.trim() === confirmPhrase;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            adminDialogPanel,
          )}
        >
          <Dialog.Title className="text-base font-semibold text-zinc-100">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-zinc-400">
            {description}
          </Dialog.Description>
          {children ? <div className="mt-4 space-y-2 text-sm text-zinc-300">{children}</div> : null}
          <div className="mt-4">
            <Label htmlFor="admin-phrase-confirm" className="text-zinc-300">
              Введите «{confirmPhrase}» для подтверждения
            </Label>
            <Input
              id="admin-phrase-confirm"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              className={cn("mt-1.5 font-mono text-sm", adminFieldInput)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <AdminFormFooterActions className="mt-6">
            <AdminDrawerCancelButton onClick={() => onOpenChange(false)}>{cancelLabel}</AdminDrawerCancelButton>
            {variant === "destructive" ? (
              <AdminDrawerDangerButton
                disabled={!phraseOk || confirming}
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
                disabled={!phraseOk || confirming}
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
