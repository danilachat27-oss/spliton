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
  adminHeaderEnvBadge,
  adminHeaderIconBtn,
  adminHeaderToolbar,
  adminShellHeader,
} from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminUserMenuProps = {
  display: string;
  staffRole: string | null;
  onLogout: () => void | Promise<void>;
};

function AdminUserMenu({ display, staffRole, onLogout }: AdminUserMenuProps) {
  const a = useAdminI18n();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          adminHeaderIconBtn,
          "w-auto min-w-9 max-w-[148px] gap-1.5 px-2",
          open && "bg-zinc-800/70 text-zinc-100",
        )}
        aria-label={a.t("admin.header.userMenuAriaLabel")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <User className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
        {display ? (
          <span className="hidden max-w-[92px] truncate text-xs font-medium text-zinc-300 lg:inline">
            {display.split("@")[0]}
          </span>
        ) : null}
        <ChevronDown
          className={cn("size-3 shrink-0 opacity-70 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn("absolute right-0 z-50 mt-1.5 min-w-[220px]", adminDropdownPanel)}
        >
          {display ? (
            <p
              className="truncate border-b border-zinc-800/80 px-3 py-2 text-xs text-zinc-500"
              title={display}
            >
              {display}
            </p>
          ) : null}
          {staffRole ? (
            <p className="px-3 py-2 text-xs text-zinc-400 md:hidden">
              {a.t("admin.header.rolePrefix")} {a.adminRoleLabel(staffRole) ?? staffRole}
            </p>
          ) : null}
          <Link
            href={ROUTES.dashboard}
            role="menuitem"
            className={cn("flex items-center gap-2", adminDropdownItem)}
            onClick={() => setOpen(false)}
          >
            {a.t("admin.header.holderCabinet")}
            <ExternalLink className="size-3 text-zinc-500" aria-hidden />
          </Link>
          <Link
            href={ROUTES.dashboardProfile}
            role="menuitem"
            className={adminDropdownItem}
            onClick={() => setOpen(false)}
          >
            {a.t("admin.header.profile")}
          </Link>
          <Link
            href={ROUTES.systemStatus}
            role="menuitem"
            className={adminDropdownItem}
            onClick={() => setOpen(false)}
          >
            {a.t("admin.header.systemStatus")}
          </Link>
          <div className="my-1 border-t border-zinc-800/80" />
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-950/40"
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
          >
            {a.t("admin.header.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminHeader() {
  const { user, logout } = useAuth();
  const envLabel = getAdminEnvironmentLabel();
  const display = user?.profile?.displayName?.trim() || user?.email || "";
  const staffRole = getPrimaryStaffRole(user?.roles);

  return (
    <header className={cn(adminHeaderBar, adminShellHeader)}>
      <AdminGlobalSearch className="min-w-0 flex-1 lg:max-w-2xl" />

      <div className={adminHeaderToolbar}>
        <span
          className={cn(
            "hidden items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline-flex",
            adminHeaderEnvBadge(envLabel),
          )}
        >
          {envLabel}
        </span>

        {staffRole ? (
          <AdminRoleBadge
            role={staffRole}
            className="hidden max-w-40 truncate ring-0 md:inline-flex"
          />
        ) : null}

        <LanguageSelector
          variant="dark"
          buttonClassName="h-9 gap-2 rounded-lg border-0 bg-transparent px-2 text-sm text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100"
        />

        <NotificationBell
          apiBasePath={ADMIN_API_PATHS.notifications}
          allHref={ROUTES.adminNotifications}
          className={adminHeaderIconBtn}
          iconClassName="size-[18px]"
          variant="dark"
        />

        <AdminUserMenu display={display} staffRole={staffRole} onLogout={logout} />
      </div>
    </header>
  );
}

export function AdminHeaderSkeleton() {
  return (
    <div className={cn(adminHeaderBar, adminShellHeader)} aria-hidden>
      <div className="h-9 min-w-0 flex-1 max-w-2xl rounded-lg bg-zinc-900/40" />
      <div className={adminHeaderToolbar}>
        <div className="hidden h-6 w-14 rounded-md bg-zinc-800/80 sm:block" />
        <div className="hidden h-6 w-28 rounded-full bg-zinc-800/80 md:block" />
        <div className="h-9 w-24 rounded-lg bg-zinc-800/80" />
        <div className="size-9 rounded-lg bg-zinc-800/80" />
        <div className="h-9 w-20 rounded-lg bg-zinc-800/80" />
      </div>
    </div>
  );
}
