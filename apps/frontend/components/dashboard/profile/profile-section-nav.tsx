"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { DashboardSectionSubheaderShell } from "@/components/dashboard/dashboard-section-subheader-shell";
import { DashboardSectionUnderlineNav } from "@/components/dashboard/dashboard-section-underline-nav";
import {
  PROFILE_PAGE_TABS,
  parseProfilePageTabParam,
  profileDashboardHref,
} from "@/constants/dashboard/profile-page";
import { useI18n } from "@/components/providers/i18n-provider";
import { profileTabLabel } from "@/lib/i18n/profile-messages";
import type { ProfilePageTabId } from "@/constants/dashboard/profile-page";

export function ProfileSectionNav() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const tab = useMemo(
    () => parseProfilePageTabParam(searchParams.get("tab")),
    [searchParams],
  );

  if (!pathname.startsWith("/dashboard/profile")) return null;

  return (
    <DashboardSectionSubheaderShell>
      <DashboardSectionUnderlineNav
        ariaLabel={t("profile.nav.ariaLabel")}
        items={PROFILE_PAGE_TABS.map((item) => ({
          href: profileDashboardHref(item.id),
          label: profileTabLabel(item.id as ProfilePageTabId, locale),
          active: item.id === tab,
          scroll: false,
        }))}
      />
    </DashboardSectionSubheaderShell>
  );
}
