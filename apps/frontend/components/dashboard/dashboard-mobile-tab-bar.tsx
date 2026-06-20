"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Compass, LayoutGrid, PieChart, UserRound } from "@/lib/lucide";
import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TabId = "home" | "catalog" | "trade" | "portfolio" | "profile";

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Одна активная вкладка; на прочих страницах — без подсветки. */
function resolveActiveTab(pathname: string, profileOpen: boolean): TabId | null {
  if (profileOpen) return "profile";

  const path = normalizePath(pathname);

  if (path.startsWith("/dashboard/profile")) return "profile";
  if (path.startsWith("/dashboard/secondary-market")) return "trade";
  if (
    path === "/catalog" ||
    path.startsWith("/catalog/") ||
    path.startsWith("/analytics/releases")
  ) {
    return "catalog";
  }
  if (path.startsWith("/assets")) return "portfolio";
  if (path === "/app") return "home";

  return null;
}

const tabLabelClass =
  "max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-none tracking-tight";

const tabCellClass =
  "flex h-full w-full min-w-0 flex-col items-center justify-center gap-1";

const tabIconClass = "size-[1.375rem] shrink-0";

function TabItem({
  href,
  label,
  active,
  icon: Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: typeof LayoutGrid;
}) {
  return (
    <Link
      href={href}
      className={tabCellClass}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(tabIconClass, active ? "text-white" : "text-zinc-500")}
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden
      />
      <span className={cn(tabLabelClass, active ? "text-white" : "text-zinc-500")}>{label}</span>
    </Link>
  );
}

function TradeTabItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="flex h-full w-full min-w-0 flex-col items-center justify-center gap-0.5"
      aria-current={active ? "page" : undefined}
    >
      <span className="flex size-[3.25rem] -translate-y-1.5 items-center justify-center rounded-full bg-white">
        <ArrowLeftRight className="size-[1.35rem] text-black" strokeWidth={2.5} aria-hidden />
      </span>
      <span className={cn(tabLabelClass, active ? "text-white" : "text-zinc-500")}>{label}</span>
    </Link>
  );
}

function ProfileTabItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={tabCellClass}
      aria-current={active ? "page" : undefined}
      aria-expanded={active}
    >
      <UserRound
        className={cn(tabIconClass, active ? "text-white" : "text-zinc-500")}
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden
      />
      <span className={cn(tabLabelClass, active ? "text-white" : "text-zinc-500")}>{label}</span>
    </button>
  );
}

export function DashboardMobileTabBar({
  hidden = false,
  profileOpen = false,
  onProfileOpenChange,
}: {
  hidden?: boolean;
  profileOpen?: boolean;
  onProfileOpenChange?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [mobile, setMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const activeTab = resolveActiveTab(pathname, profileOpen);
  const visible = mobile && !hidden;
  const drawerHidden = hidden || profileOpen;

  React.useEffect(() => {
    if (!visible || profileOpen) {
      document.body.classList.remove("mobile-tab-bar-active");
      return;
    }
    document.body.classList.add("mobile-tab-bar-active");
    return () => {
      document.body.classList.remove("mobile-tab-bar-active");
    };
  }, [visible, profileOpen]);

  if (!visible) return null;

  return !drawerHidden ? (
    <nav
      className="fixed inset-x-0 bottom-0 z-[110] w-full max-w-[100vw] overflow-visible pt-1.5 sm:hidden [transform:translateZ(0)]"
      aria-label={t("mobileTab.ariaLabel")}
    >
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 items-stretch justify-items-center bg-black px-2">
        <TabItem
          href={ROUTES.dashboard}
          label={t("mobileTab.home")}
          active={activeTab === "home"}
          icon={LayoutGrid}
        />
        <TabItem
          href={ROUTES.dashboardCatalog}
          label={t("mobileTab.catalog")}
          active={activeTab === "catalog"}
          icon={Compass}
        />
        <TradeTabItem
          href={ROUTES.dashboardSecondaryMarket}
          label={t("mobileTab.trade")}
          active={activeTab === "trade"}
        />
        <TabItem
          href={ROUTES.myAssetsOverview}
          label={t("mobileTab.portfolio")}
          active={activeTab === "portfolio"}
          icon={PieChart}
        />
        {isAuthenticated ? (
          <ProfileTabItem
            label={t("mobileTab.profile")}
            active={activeTab === "profile"}
            onClick={() => onProfileOpenChange?.(true)}
          />
        ) : (
          <TabItem
            href={ROUTES.login}
            label={t("mobileTab.profile")}
            active={activeTab === "profile"}
            icon={UserRound}
          />
        )}
      </div>
      <div
        aria-hidden
        className="w-full bg-black"
        style={{ minHeight: "calc(env(safe-area-inset-bottom, 0px) + 3px)" }}
      />
    </nav>
  ) : null;
}
