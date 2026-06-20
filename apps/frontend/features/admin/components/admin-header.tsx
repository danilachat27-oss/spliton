"use client";


import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, User } from "@/lib/lucide";

import { SplitonLogo } from "@/components/dashboard/revshare-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminGlobalSearch } from "@/features/admin/components/admin-global-search";
import { adminSectionFromPathname } from "@/features/admin/config/admin-sections";
import { getPrimaryStaffRole } from "@/features/admin/lib/admin-access";
import { getAdminEnvironmentLabel } from "@/features/admin/lib/admin-format";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminRoleBadge } from "@/features/admin/ui";
import { ROUTES } from "@/constants/routes";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { getAdminApiBaseUrl } from "@/features/admin/api/admin-api.config";
import { adminDropdownItem, adminDropdownPanel } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

const headerIconClass =
  "flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100";

export function AdminHeader() {
  const a = useAdminI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const sectionId = adminSectionFromPathname(pathname);
  const envLabel = getAdminEnvironmentLabel();
  const display = user?.profile?.displayName?.trim() || user?.email || "";
  const staffRole = getPrimaryStaffRole(user?.roles);

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800/80 bg-[#141416] px-3 text-zinc-100 sm:gap-4 sm:px-5">
      <div className="hidden shrink-0 md:block">
        <SplitonLogo href={ROUTES.admin} />
      </div>

      <nav className="hidden min-w-0 text-xs text-zinc-500 md:flex md:items-center md:gap-1">
        <Link href={ROUTES.admin} className="hover:text-zinc-300">
          {a.portal.breadcrumbRoot}
        </Link>
        {sectionId !== "dashboard" ? (
          <>
            <span className="text-zinc-300">/</span>
            <span className="truncate text-zinc-300">{a.adminSectionLabel(sectionId)}</span>
          </>
        ) : null}
      </nav>

      <AdminGlobalSearch className="min-w-0 flex-1" />

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <span
          className={cn(
            "hidden rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide sm:inline",
            envLabel === "Production"
              ? "bg-emerald-500/15 text-emerald-400"
              : envLabel === "Staging"
                ? "bg-amber-500/15 text-amber-400"
                : "bg-zinc-700/50 text-zinc-400",
          )}
        >
          {envLabel}
        </span>
        {staffRole ? <AdminRoleBadge role={staffRole} /> : null}
        <LanguageSelector variant="admin" />
        <NotificationBell
          apiBasePath={`${getAdminApiBaseUrl()}/notifications`}
          allHref={ROUTES.adminNotifications}
          className={headerIconClass}
          iconClassName="size-[18px]"
        />
        <details className="relative">
          <summary className="list-none [&::-webkit-details-marker]:hidden">
            <button
              type="button"
              className={cn(headerIconClass, "gap-1 px-2 w-auto min-w-9")}
              aria-label={a.t("admin.header.userMenuAriaLabel")}
            >
              <User className="size-[18px]" strokeWidth={1.75} aria-hidden />
              <ChevronDown className="size-3 hidden sm:block" aria-hidden />
            </button>
          </summary>
          <div className={cn("absolute right-0 z-50 mt-1 min-w-[220px] shadow-lg", adminDropdownPanel)}>
            {display ? (
              <p className="truncate px-3 py-1 text-xs text-zinc-500" title={display}>
                {display}
              </p>
            ) : null}
            {staffRole ? (
              <p className="px-3 pb-2 text-xs text-zinc-400">
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
    <div
      className="relative z-40 flex h-14 shrink-0 items-center gap-4 border-b border-zinc-800/80 bg-[#141416] px-4"
      aria-hidden
    >
      <div className="size-7 shrink-0 rounded-lg bg-zinc-800" />
      <div className="h-9 min-w-0 flex-1 max-w-md rounded-xl bg-zinc-800" />
      <div className="size-9 shrink-0 rounded-xl bg-zinc-800" />
    </div>
  );
}
