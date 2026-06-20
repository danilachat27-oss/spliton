"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, User } from "@/lib/lucide";

import { useAuth } from "@/components/providers/auth-provider";
import { AdminGlobalSearch } from "@/features/admin/components/admin-global-search";
import { getPrimaryStaffRole } from "@/features/admin/lib/admin-access";
import { getAdminEnvironmentLabel } from "@/features/admin/lib/admin-format";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminRoleBadge } from "@/features/admin/ui";
import { ROUTES } from "@/constants/routes";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import {
  adminDropdownItem,
  adminDropdownPanel,
  adminHeaderBar,
  adminHeaderDivider,
  adminHeaderEnvBadge,
  adminHeaderIconBtn,
  adminHeaderToolbar,
  adminShellHeader,
} from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const a = useAdminI18n();
  const { user, logout } = useAuth();
  const envLabel = getAdminEnvironmentLabel();
  const display = user?.profile?.displayName?.trim() || user?.email || "";
  const staffRole = getPrimaryStaffRole(user?.roles);

  return (
    <header className={cn(adminHeaderBar, adminShellHeader)}>
      <AdminGlobalSearch className="min-w-0 flex-1 lg:max-w-xl" />

      <div aria-hidden className={cn(adminHeaderDivider, "md:block")} />

      <div className={adminHeaderToolbar}>
        <span
          className={cn(
            "mx-0.5 hidden items-center rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline-flex",
            adminHeaderEnvBadge(envLabel),
          )}
        >
          {envLabel}
        </span>

        {staffRole ? (
          <>
            <div aria-hidden className={adminHeaderDivider} />
            <AdminRoleBadge
              role={staffRole}
              className="mx-1 hidden max-w-36 truncate md:inline-flex"
            />
          </>
        ) : null}

        <div aria-hidden className={adminHeaderDivider} />

        <LanguageSelector
          variant="admin"
          buttonClassName="h-8 rounded-lg border-0 bg-transparent px-2 hover:bg-zinc-800/80"
        />

        <div aria-hidden className={adminHeaderDivider} />

        <NotificationBell
          apiBasePath={ADMIN_API_PATHS.notifications}
          allHref={ROUTES.adminNotifications}
          className={adminHeaderIconBtn}
          iconClassName="size-[18px]"
        />

        <details className="relative">
          <summary className="list-none [&::-webkit-details-marker]:hidden">
            <button
              type="button"
              className={cn(adminHeaderIconBtn, "gap-0.5 px-2 w-auto min-w-8 max-w-[140px]")}
              aria-label={a.t("admin.header.userMenuAriaLabel")}
            >
              <User className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
              {display ? (
                <span className="hidden max-w-[88px] truncate text-xs font-medium text-zinc-300 lg:inline">
                  {display.split("@")[0]}
                </span>
              ) : null}
              <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
            </button>
          </summary>
          <div className={cn("absolute right-0 z-50 mt-1.5 min-w-[220px]", adminDropdownPanel)}>
            {display ? (
              <p className="truncate border-b border-zinc-800/80 px-3 py-2 text-xs text-zinc-500" title={display}>
                {display}
              </p>
            ) : null}
            {staffRole ? (
              <p className="px-3 py-2 text-xs text-zinc-400 md:hidden">
                {a.t("admin.header.rolePrefix")} {a.adminRoleLabel(staffRole) ?? staffRole}
              </p>
            ) : null}
            <Link href={ROUTES.dashboard} className={cn("flex items-center gap-2", adminDropdownItem)}>
              {a.t("admin.header.holderCabinet")}
              <ExternalLink className="size-3 text-zinc-500" aria-hidden />
            </Link>
            <Link href={ROUTES.dashboardProfile} className={adminDropdownItem}>
              {a.t("admin.header.profile")}
            </Link>
            <Link href={ROUTES.systemStatus} className={adminDropdownItem}>
              {a.t("admin.header.systemStatus")}
            </Link>
            <div className="my-1 border-t border-zinc-800/80" />
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-950/40"
              onClick={() => void logout()}
            >
              {a.t("admin.header.logout")}
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}

export function AdminHeaderSkeleton() {
  return (
    <div className={cn(adminHeaderBar, adminShellHeader)} aria-hidden>
      <div className="h-9 min-w-0 flex-1 max-w-xl rounded-xl border border-zinc-800/80 bg-zinc-900/50" />
      <div className={adminHeaderDivider} />
      <div className="flex h-9 items-center gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-1">
        <div className="hidden h-6 w-14 rounded-lg bg-zinc-800 sm:block" />
        <div className="size-8 rounded-lg bg-zinc-800" />
        <div className="size-8 rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}
