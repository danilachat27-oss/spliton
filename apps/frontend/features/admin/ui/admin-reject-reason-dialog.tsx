"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Label } from "@/components/ui/label";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminFormFooterActions } from "@/features/admin/ui/admin-form-footer";
import { adminDialogPanel, adminFieldTextarea } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminRejectReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  minLength?: number;
  submitting?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
};

export function AdminRejectReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  minLength = 3,
  submitting = false,
  onConfirm,
}: AdminRejectReasonDialogProps) {
  const a = useAdminI18n();
  const displayConfirmLabel = confirmLabel ?? a.actions.reject;
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const valid = reason.trim().length >= minLength;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            adminDialogPanel,
          )}
        >
          <Dialog.Title className="text-base font-semibold text-zinc-100">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-zinc-400">
              {description}
            </Dialog.Description>
          ) : null}
          <div className="mt-4">
            <Label htmlFor="admin-reject-reason" className="text-zinc-300">{a.t("admin.ui.reason")}</Label>
            <textarea
              id="admin-reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className={cn("mt-1.5", adminFieldTextarea)}
              placeholder={a.t("admin.ui.reasonPlaceholder")}
            />
          </div>
          <AdminFormFooterActions className="mt-6">
            <AdminDrawerCancelButton disabled={submitting} onClick={() => onOpenChange(false)}>
              {a.actions.cancel}
            </AdminDrawerCancelButton>
            <AdminDrawerDangerButton
              disabled={!valid || submitting}
              onClick={() => void onConfirm(reason.trim())}
            >
              {submitting ? a.t("admin.drawer.common.saving") : displayConfirmLabel}
            </AdminDrawerDangerButton>
          </AdminFormFooterActions>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
