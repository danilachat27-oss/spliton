"use client";

import { useReadOnlySectionError } from "@/hooks/use-read-only-section-error";

import { SectionUnavailableState } from "@/components/shared/data-states/section-unavailable-state";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminCard } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  sectionId?: string;
  error?: unknown;
};

export function AdminErrorState({
  title,
  message,
  onRetry,
  className,
  sectionId = "admin-section",
  error,
}: AdminErrorStateProps) {
  const a = useAdminI18n();
  useReadOnlySectionError(sectionId, error ?? title ?? message ?? a.empty.loadError, onRetry);

  return (
    <SectionUnavailableState
      className={cn(adminCard("px-6 py-14"), className)}
      variant="admin"
      title={title ?? a.empty.loadError}
      description={message ?? a.t("admin.ui.loadErrorMessage")}
      onRetry={onRetry}
      retryLabel={a.empty.retry}
    />
  );
}
