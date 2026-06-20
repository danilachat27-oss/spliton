"use client";

import * as React from "react";
import { RefreshCw } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  ADMIN_SECTION_BG,
  ADMIN_SECTION_PANEL,
} from "@/features/admin/lib/admin-section-styles";
import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminInfoHint,
  type AdminBreadcrumbItem,
} from "@/features/admin/ui";
import { adminSectionToolbarActions } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export type AdminSectionTabItem = {
  id: string;
  label: string;
  count?: number;
};

type AdminSectionShellProps = {
  /** Ключ из ADMIN_SECTION_LABELS для breadcrumbs */
  sectionId?: string;
  title: string;
  breadcrumbs?: AdminBreadcrumbItem[];
  /** Подсказка «i» в правом верхнем углу шапки */
  infoHint?: React.ReactNode;
  actions?: React.ReactNode;
  banner?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AdminSectionShell({
  sectionId,
  title,
  breadcrumbs,
  infoHint,
  actions,
  banner,
  children,
  className,
}: AdminSectionShellProps) {
  const a = useAdminI18n();
  const headerActions =
    infoHint || actions ? (
      <div className={adminSectionToolbarActions}>
        {infoHint ? (
          <AdminInfoHint
            size="md"
            placement="bottom-end"
            text={infoHint}
            iconClassName="size-9 rounded-xl"
            panelClassName="max-w-sm"
          />
        ) : null}
        {actions}
      </div>
    ) : undefined;
  return (
    <AdminPageShell contained className={cn(ADMIN_SECTION_BG, className)}>
      <div className="space-y-6 pb-8 sm:space-y-8">
        <AdminPageHeader
          title={title}
          breadcrumbs={breadcrumbs ?? (sectionId ? a.adminSectionBreadcrumbs(sectionId) : undefined)}
          actions={headerActions}
        />
        {banner}
        {children}
      </div>
    </AdminPageShell>
  );
}

export function AdminSectionPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn(ADMIN_SECTION_PANEL, "space-y-5", className)}>{children}</section>;
}

export function AdminSectionTabBar({
  tabs,
  activeId,
  onChange,
  className,
}: {
  tabs: AdminSectionTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={activeId === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
            activeId === t.id
              ? "bg-[#B7F500] text-zinc-950"
              : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800/55 hover:text-zinc-200",
          )}
        >
          {t.label}
          {t.count !== undefined ? (
            <span className="ml-1.5 tabular-nums opacity-80">({t.count})</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function AdminSectionRefreshButton({
  onClick,
  variant = "default",
  loading = false,
  disabled,
}: {
  onClick: () => void;
  variant?: "default" | "primary";
  loading?: boolean;
  disabled?: boolean;
}) {
  const a = useAdminI18n();
  const label = loading ? a.t("admin.analytics.common.refreshing") : a.portal.refresh;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className={cn(
        "shrink-0 rounded-xl",
        variant === "primary"
          ? "bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
          : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
      )}
      onClick={onClick}
      disabled={disabled ?? loading}
      aria-label={label}
      title={label}
    >
      <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
    </Button>
  );
}

export function AdminSectionDataArea({
  loading,
  error,
  onRetry,
  loadingLabel = "Загрузка…",
  children,
}: {
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  loadingLabel?: string;
  children: React.ReactNode;
}) {
  if (loading) return <AdminLoadingState label={loadingLabel} centered />;
  if (error) return <AdminErrorState onRetry={onRetry ?? (() => {})} />;
  return <>{children}</>;
}
