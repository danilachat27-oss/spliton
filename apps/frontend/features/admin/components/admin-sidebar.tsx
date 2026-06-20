"use client";




import * as React from "react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { ChevronLeft, ChevronRight } from "@/lib/lucide";



import { SplitonLogo } from "@/components/dashboard/revshare-logo";

import { useAuth } from "@/components/providers/auth-provider";

import {

  getVisibleAdminNavGroups,

  type AdminNavItem,

} from "@/features/admin/config/admin-sections";

import { useNotificationsUnread } from "@/components/notifications/notifications-unread-context";
import { getAdminEnvironmentLabel } from "@/features/admin/lib/admin-format";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

import { AdminNavLink } from "@/features/admin/components/admin-nav-link";
import {
  prefetchAdminRoutes,
  preloadAdminSectionModules,
} from "@/features/admin/lib/admin-preload-sections";

import { ROUTES } from "@/constants/routes";

import { cn } from "@/lib/utils";



const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 72;



function readSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function normalizeNavPath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function navBaseMatches(pathname: string, base: string): boolean {
  const path = normalizeNavPath(pathname);
  const root = normalizeNavPath(base);
  if (path === root) return true;
  return path.startsWith(`${root}/`);
}

function navItemMatchesPath(item: AdminNavItem, pathname: string): boolean {
  const [base, query] = item.href.split("?");

  if (item.href.startsWith("#")) return false;
  if (!navBaseMatches(pathname, base)) return false;

  if (!query) return true;

  const params = new URLSearchParams(query);
  const itemTab = params.get("tab");
  const itemPanel = params.get("panel");

  if (itemTab) return readSearchParam("tab") === itemTab;
  if (itemPanel) return readSearchParam("panel") === itemPanel;

  return normalizeNavPath(pathname) === normalizeNavPath(base);
}

/** Only the most specific matching nav href is active (fixes /admin/analytics vs /admin/analytics/operations). */
function resolveActiveNavHref(pathname: string, items: AdminNavItem[]): string | null {
  const matches = items
    .filter((item) => navItemMatchesPath(item, pathname))
    .map((item) => normalizeNavPath(item.href.split("?")[0]!));

  if (matches.length === 0) return null;

  return matches.sort((a, b) => b.length - a.length)[0]!;
}

function isNavItemActive(item: AdminNavItem, activeBase: string | null): boolean {
  if (!activeBase) return false;
  return normalizeNavPath(item.href.split("?")[0]!) === activeBase;
}



export function AdminSidebar() {
  const a = useAdminI18n();

  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const groups = getVisibleAdminNavGroups(user?.roles);
  const navItems = React.useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const activeNavHref = resolveActiveNavHref(pathname, navItems);

  React.useEffect(() => {
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href)).filter((h) => !h.startsWith("#"));
    prefetchAdminRoutes(router, hrefs);
    preloadAdminSectionModules();
  }, [router, groups]);

  const [collapsed, setCollapsed] = React.useState(false);

  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const envLabel = getAdminEnvironmentLabel();
  const notificationsUnread = useNotificationsUnread()?.unread ?? 0;



  return (

    <aside

      style={{ width }}

      className="relative z-30 flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-[#141416] text-zinc-300 transition-[width] duration-200"

      aria-label={a.t("admin.sidebar.navAriaLabel")}

    >

      <div className={cn("shrink-0", collapsed ? "px-2 py-3" : "px-3 py-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <SplitonLogo href={ROUTES.admin} className="text-white" />
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex size-9 w-full items-center justify-center rounded-xl bg-zinc-900/40 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={a.t("admin.sidebar.expandMenu")}
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SplitonLogo href={ROUTES.admin} className="text-white" />
              <p className="mt-1 text-[11px] font-medium text-zinc-500">{a.portal.brandSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={a.t("admin.sidebar.collapseMenu")}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>



      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          collapsed && "px-1",
        )}
      >

        {groups.map((group, groupIndex) => (
          <div key={group.id} className={cn("mb-2", !collapsed && "mb-3")}>
            {!collapsed ? (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                {a.navGroupLabel(group.id)}
              </p>
            ) : groupIndex > 0 ? (
              <div className="mx-auto my-2 h-px w-8 rounded-full bg-zinc-800/90" aria-hidden />
            ) : null}

            {group.items.map((item) => {
              const active = isNavItemActive(item, activeNavHref);
              const Icon = item.icon;
              const showUnreadBadge = item.id === "notifications" && notificationsUnread > 0;
              const unreadLabel =
                notificationsUnread > 99 ? "99+" : String(notificationsUnread);

              return (
                <AdminNavLink
                  key={`${group.id}-${item.id}-${item.href}`}
                  href={item.href}
                  active={active}
                  collapsed={collapsed}
                  title={a.adminSectionLabel(item.id)}
                  testId={`admin-nav-${item.id}`}
                  external={item.external}
                  className={cn(
                    "relative flex items-center text-[13px] font-medium transition-colors",
                    collapsed
                      ? cn(
                          "mx-auto mb-0.5 size-10 justify-center rounded-xl",
                          active
                            ? "bg-zinc-800 text-white ring-1 ring-zinc-700/80"
                            : "text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200",
                        )
                      : cn(
                          "mx-2 gap-2.5 rounded-xl px-2.5 py-2",
                          active
                            ? "bg-white/10 text-white shadow-black/20"
                            : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
                        ),
                  )}
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden />
                  {!collapsed ? (
                    <>
                      <span className="min-w-0 flex-1 truncate">{a.adminSectionLabel(item.id)}</span>
                      {showUnreadBadge ? (
                        <span className="ml-auto shrink-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                          {unreadLabel}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                  {collapsed && showUnreadBadge ? (
                    <span
                      className="absolute right-1 top-1 size-2 rounded-full bg-red-600 ring-2 ring-[#141416]"
                      aria-label={`${unreadLabel} непрочитанных`}
                    />
                  ) : null}
                </AdminNavLink>
              );
            })}
          </div>
        ))}

      </nav>



      {!collapsed ? (
        <div className="mt-auto shrink-0 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0 rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              {envLabel}
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">v1.0</span>
          </div>
          <p className="mt-2 min-w-0 text-[10px] leading-snug text-zinc-600">
            {a.t("admin.sidebar.footer")}
          </p>
        </div>
      ) : (
        <div className="mt-auto shrink-0 px-2 py-3">
          <span
            className={cn(
              "mx-auto block size-2.5 rounded-full",
              envLabel === "Production"
                ? "bg-emerald-500"
                : envLabel === "Staging"
                  ? "bg-amber-500"
                  : "bg-zinc-600",
            )}
            title={envLabel}
          />
        </div>
      )}

    </aside>

  );

}



/** @deprecated use ADMIN_NAV_GROUPS */

export { ADMIN_NAV_ITEMS } from "@/features/admin/config/admin-sections";


