"use client";

import * as React from "react";

import { AdminConfirmDialog } from "@/features/admin/ui";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

type UseAdminDrawerUnsavedGuardArgs = {
  open: boolean;
  dirty: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function useAdminDrawerUnsavedGuard({
  open,
  dirty,
  onOpenChange,
  title,
  description,
}: UseAdminDrawerUnsavedGuardArgs) {
  const a = useAdminI18n();
  const displayTitle = title ?? a.t("admin.drawer.unsavedTitle");
  const displayDescription = description ?? a.t("admin.drawer.unsavedDescription");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const dirtyRef = React.useRef(dirty);

  React.useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const requestClose = React.useCallback(() => {
    if (dirtyRef.current) {
      setConfirmOpen(true);
      return;
    }
    onOpenChange(false);
  }, [onOpenChange]);

  const guardedOnOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        requestClose();
        return;
      }
      onOpenChange(true);
    },
    [onOpenChange, requestClose],
  );

  const confirmClose = React.useCallback(() => {
    setConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const UnsavedChangesDialog = (
    <AdminConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title={displayTitle}
      description={displayDescription}
      confirmLabel={a.t("admin.drawer.unsavedConfirm")}
      variant="destructive"
      onConfirm={confirmClose}
    />
  );

  return { guardedOnOpenChange, requestClose, UnsavedChangesDialog, confirmOpen };
}
