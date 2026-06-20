"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ROUTES } from "@/constants/routes";

const TAB_ROUTES: Record<string, string> = {
  overview: ROUTES.admin,
  releases: ROUTES.adminTracks,
  investors: ROUTES.adminUsers,
  finances: ROUTES.adminWithdrawals,
  payouts: ROUTES.adminRevenue,
  market: ROUTES.adminSecondaryMarket,
  audit: ROUTES.adminAudit,
};

/** Перенаправление старых `?tab=` ссылок на новые маршруты. */
export function AdminLegacyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const section = searchParams.get("section");

  React.useEffect(() => {
    if (section === "settings") {
      router.replace(ROUTES.adminSettings);
      return;
    }
    if (searchParams.get("panel") === "tasks") {
      router.replace(ROUTES.adminOperatorTasks);
      return;
    }
    if (tab && TAB_ROUTES[tab]) {
      router.replace(TAB_ROUTES[tab]);
    }
  }, [tab, section, router, searchParams]);

  return null;
}
