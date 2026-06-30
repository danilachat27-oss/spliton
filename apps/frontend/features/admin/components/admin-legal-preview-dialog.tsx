"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";

import { LegalPolicyContentDisplay } from "@/components/legal/legal-policy-content-display";
import { AdminDrawerSecondaryButton } from "@/features/admin/components/admin-drawer-buttons";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminDialogPanel } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminLegalPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  version: string;
  content: string;
  contentFormat?: string;
};

export function AdminLegalPreviewDialog({
  open,
  onOpenChange,
  title,
  version,
  content,
  contentFormat = "MARKDOWN",
}: AdminLegalPreviewDialogProps) {
  const a = useAdminI18n();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-[121] max-h-[90vh] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
            adminDialogPanel,
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-zinc-100">{title}</Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-zinc-500">
            {a.t("admin.legal.preview.versionLine")
              .replace("{version}", version)
              .replace("{format}", contentFormat)}
          </Dialog.Description>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <LegalPolicyContentDisplay
              content={content}
              contentFormat={contentFormat}
              className="prose prose-invert max-w-none text-sm leading-relaxed text-zinc-200"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <AdminDrawerSecondaryButton onClick={() => onOpenChange(false)}>{a.t("admin.actions.close")}</AdminDrawerSecondaryButton>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
