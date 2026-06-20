"use client";

import { usePathname } from "next/navigation";

import { getAssetsTabs } from "@/components/dashboard/assets/assets-tabs";
import { DashboardSectionSubheaderShell } from "@/components/dashboard/dashboard-section-subheader-shell";
import { DashboardSectionUnderlineNav } from "@/components/dashboard/dashboard-section-underline-nav";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

function isSectionActive(pathname: string, href: string): boolean {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (href === ROUTES.dashboardPositions && pathname.startsWith(`${ROUTES.myAssetsSellUnits}/`)) return true;
  return false;
}

export function AssetsSectionNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = getAssetsTabs(t);

  return (
    <DashboardSectionSubheaderShell>
      <DashboardSectionUnderlineNav
        ariaLabel={t("overview.navAria")}
        className="sm:gap-8"
        items={tabs.map((tab) => ({
          href: tab.href,
          label: tab.label,
          active: isSectionActive(pathname, tab.href),
        }))}
      />
    </DashboardSectionSubheaderShell>
  );
}
