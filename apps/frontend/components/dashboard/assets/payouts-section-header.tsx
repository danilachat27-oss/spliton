"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DashboardSectionSubheaderShell } from "@/components/dashboard/dashboard-section-subheader-shell";
import { DashboardSectionUnderlineNav } from "@/components/dashboard/dashboard-section-underline-nav";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

const BASE = ROUTES.dashboardPayouts;

type NavItem = {
  href: string;
  labelKey: string;
  overviewRoot?: boolean;
};

const payoutHeaderItems: NavItem[] = [
  { href: BASE, labelKey: "payouts.nav.overview", overviewRoot: true },
  { href: ROUTES.dashboardPayoutsComparison, labelKey: "payouts.nav.comparison" },
  { href: ROUTES.dashboardPayoutsHistory, labelKey: "payouts.nav.history" },
  { href: `${BASE}/deposit`, labelKey: "payouts.nav.deposit" },
  { href: `${BASE}/withdraw`, labelKey: "payouts.nav.withdraw" },
];

function isPayoutsNavActive(pathname: string, item: NavItem) {
  const p = pathname.replace(/\/$/, "") || "/";
  if (item.overviewRoot) {
    return p === BASE;
  }
  return p === item.href.replace(/\/$/, "") || p.startsWith(`${item.href.replace(/\/$/, "")}/`);
}

export function PayoutsSectionHeader() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();

  return (
    <DashboardSectionSubheaderShell>
      <DashboardSectionUnderlineNav
        ariaLabel={t("payouts.navAria")}
        items={payoutHeaderItems.map((item) => ({
          href: item.href,
          label: t(item.labelKey),
          active: isPayoutsNavActive(pathname, item),
        }))}
      />
    </DashboardSectionSubheaderShell>
  );
}
