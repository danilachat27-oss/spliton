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

const SIDEBAR_COLLAPSED = 68;



function readSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  const [base, query] = item.href.split("?");

  if (item.href.startsWith("#")) return false;

  if (pathname !== base && !pathname.startsWith(`${base}/`)) return false;

  if (!query) return pathname === base || (base !== ROUTES.admin && pathname.startsWith(base!));

  const params = new URLSearchParams(query);
  const itemTab = params.get("tab");
  const itemPanel = params.get("panel");

  if (itemTab) return readSearchParam("tab") === itemTab;
  if (itemPanel) return readSearchParam("panel") === itemPanel;

  return pathname === base;
}



export function AdminSidebar() {
  const a = useAdminI18n();

  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const groups = getVisibleAdminNavGroups(user?.roles);

  React.useEffect(() => {
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href)).filter((h) => !h.startsWith("#"));
    prefetchAdminRoutes(router, hrefs);
    preloadAdminSectionModules();
  }, [router, groups]);

  const [collapsed, setCollapsed] = React.useState(false);

  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const envLabel = getAdminEnvironmentLabel();



  return (

    <aside

      style={{ width }}

      className="relative z-30 flex h-full min-h-0 shrink-0 flex-col border-r border-zinc-800/80 bg-[#141416] text-zinc-300 transition-[width] duration-200"

      aria-label={a.t("admin.sidebar.navAriaLabel")}

    >

      <div className="shrink-0 border-b border-zinc-800/80 px-3 py-3">

        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>

          {!collapsed ? (

            <div className="min-w-0 flex-1">

              <SplitonLogo href={ROUTES.admin} className="text-white" />

              <p className="mt-1 text-[11px] font-medium text-zinc-500">{a.portal.brandSubtitle}</p>

            </div>

          ) : (

            <SplitonLogo href={ROUTES.admin} className="text-white" />

          )}

          <button

            type="button"

            onClick={() => setCollapsed((c) => !c)}

            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"

            aria-label={collapsed ? a.t("admin.sidebar.expandMenu") : a.t("admin.sidebar.collapseMenu")}

          >

            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}

          </button>

        </div>

      </div>



      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {groups.map((group) => (

          <div key={group.id} className="mb-3">

            {!collapsed ? (

              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">

                {a.navGroupLabel(group.id)}

              </p>

            ) : (

              <div className="mx-3 mb-1 border-t border-zinc-800/80" aria-hidden />

            )}

            {group.items.map((item) => {

              const active = isNavItemActive(item, pathname);

              const Icon = item.icon;

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

                    "mx-2 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors",

                    active

                      ? "bg-white/10 text-white shadow-sm shadow-black/20"

                      : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",

                    collapsed && "justify-center px-0",

                  )}

                >

                  <Icon className="size-[18px] shrink-0" aria-hidden />

                  {!collapsed ? <span className="truncate">{a.adminSectionLabel(item.id)}</span> : null}

                </AdminNavLink>

              );

            })}

          </div>

        ))}

      </nav>



      {!collapsed ? (
        <div className="mt-auto shrink-0 border-t border-zinc-800/80 px-3 py-3">
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
      ) : null}

    </aside>

  );

}



/** @deprecated use ADMIN_NAV_GROUPS */

export { ADMIN_NAV_ITEMS } from "@/features/admin/config/admin-sections";


