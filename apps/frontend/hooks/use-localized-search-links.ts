"use client";

import { useMemo } from "react";
import type { LucideIcon } from "@/lib/lucide";
import {
  Banknote,
  BarChart3,
  Calculator,
  CircleDollarSign,
  Compass,
  Home,
  LayoutGrid,
  LifeBuoy,
  LineChart,
  Newspaper,
  Repeat2,
  Signal,
  UserRound,
  Users,
  Wallet,
} from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

export type SearchSectionId = "cabinet" | "trading" | "services";

export type LocalizedSearchLink = {
  id: string;
  title: string;
  hint: string;
  href: string;
  section: SearchSectionId;
  Icon: LucideIcon;
};

const SEARCH_LINK_DEFS: Omit<LocalizedSearchLink, "title" | "hint">[] = [
  { id: "home", href: ROUTES.dashboard, section: "cabinet", Icon: Home },
  { id: "catalog", href: ROUTES.dashboardCatalog, section: "cabinet", Icon: LayoutGrid },
  { id: "assets", href: ROUTES.dashboardOverview, section: "cabinet", Icon: Wallet },
  { id: "payouts", href: ROUTES.dashboardPayouts, section: "cabinet", Icon: Banknote },
  { id: "profile", href: ROUTES.dashboardProfile, section: "cabinet", Icon: UserRound },
  { id: "analytics", href: ROUTES.analyticsReleases, section: "cabinet", Icon: BarChart3 },
  { id: "secondary", href: ROUTES.dashboardSecondaryMarket, section: "trading", Icon: Repeat2 },
  { id: "market", href: ROUTES.catalogMarketOverview, section: "trading", Icon: LineChart },
  { id: "guide", href: ROUTES.guideSelection, section: "trading", Icon: Compass },
  { id: "support", href: ROUTES.support, section: "services", Icon: LifeBuoy },
  { id: "news", href: ROUTES.news, section: "services", Icon: Newspaper },
  { id: "fees", href: ROUTES.fees, section: "services", Icon: CircleDollarSign },
  { id: "calculator", href: ROUTES.calculator, section: "services", Icon: Calculator },
  { id: "status", href: ROUTES.systemStatus, section: "services", Icon: Signal },
  { id: "referral", href: ROUTES.referralProgram, section: "services", Icon: Users },
];

export function useLocalizedSearchLinks(): LocalizedSearchLink[] {
  const { t } = useI18n();
  return useMemo(
    () =>
      SEARCH_LINK_DEFS.map((item) => ({
        ...item,
        title: t(`navigation.search.${item.id}.title`),
        hint: t(`navigation.search.${item.id}.hint`),
      })),
    [t],
  );
}

export function useLocalizedSearchSections(): Record<SearchSectionId, string> {
  const { t } = useI18n();
  return useMemo(
    () => ({
      cabinet: t("navigation.search.section.cabinet"),
      trading: t("navigation.search.section.trading"),
      services: t("navigation.search.section.services"),
    }),
    [t],
  );
}
