"use client";

import { useMemo } from "react";

import type { DashboardNavSubItem } from "@/components/dashboard/dashboard-nav";
import { PROFILE_MEGAMENU_ITEMS, SUPPORT_MEGAMENU_ITEMS } from "@/components/dashboard/dashboard-megamenu";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/components/providers/i18n-provider";

function slugFromHref(href: string): string {
  return href.replace(/^\//, "").replace(/\//g, ".") || "root";
}

function footerLinkKey(href: string): string {
  return `footer.links.${slugFromHref(href)}`;
}

export function useShellT() {
  const { t } = useI18n();
  return t;
}

function profileMenuSlug(item: DashboardNavSubItem): string {
  if (item.danger) return "logout";
  const match = item.href.match(/[?&]tab=([^&]+)/);
  return match?.[1] ?? "overview";
}

export function useLocalizedProfileMenuItems(): DashboardNavSubItem[] {
  const { t } = useI18n();
  return useMemo(
    () =>
      PROFILE_MEGAMENU_ITEMS.map((item) => {
        const slug = profileMenuSlug(item);
        return {
          ...item,
          label: t(`navigation.profile.${slug}.label`, item.label),
          description: t(`navigation.profile.${slug}.desc`, item.description),
        };
      }),
    [t],
  );
}

function supportMenuSlug(item: DashboardNavSubItem): string {
  if (item.href === ROUTES.support) return "hub";
  if (item.href === ROUTES.dashboardSupport) return "openTicket";
  if (item.href === ROUTES.systemStatus) return "systemStatus";
  if (item.href.includes("tab=security")) return "security";
  return "hub";
}

export function useLocalizedSupportMenuItems(): DashboardNavSubItem[] {
  const { t } = useI18n();
  return useMemo(
    () =>
      SUPPORT_MEGAMENU_ITEMS.map((item) => {
        const slug = supportMenuSlug(item);
        return {
          ...item,
          label:
            slug === "hub"
              ? t("support.hero.title", item.label)
              : t(`support.quick.${slug}.title`, item.label),
          description:
            slug === "hub"
              ? t("support.hero.subtitle", item.description)
              : t(`support.quick.${slug}.description`, item.description),
        };
      }),
    [t],
  );
}

export type FooterLink = { label: string; href: string };

export function useFooterLinkGroups() {
  const { t } = useI18n();

  return useMemo(() => {
    const link = (href: string): FooterLink => ({
      href,
      label: t(footerLinkKey(href)),
    });

    return {
      assets: [
        link(ROUTES.dashboardOverview),
        link(ROUTES.dashboardMetrics),
        link(ROUTES.dashboardPositions),
        link(ROUTES.dashboardActivity),
        link(ROUTES.dashboardPayouts),
        link(ROUTES.dashboardPayoutsHistory),
        link(ROUTES.dashboardPayoutsComparison),
        link(`${ROUTES.dashboardPayouts}/deposit`),
        link(`${ROUTES.dashboardPayouts}/withdraw`),
      ],
      market: [
        link(ROUTES.dashboardSecondaryMarket),
        link(ROUTES.dashboardCatalog),
        link(ROUTES.catalogMarketOverview),
        link(ROUTES.catalogReleaseParameters),
        link(ROUTES.analyticsReleases),
        link(ROUTES.calculator),
      ],
      learn: [
        link(ROUTES.guideSelection),
        link(ROUTES.guideDealStructure),
        link(ROUTES.fees),
        link(ROUTES.assetsUnt),
      ],
      services: [
        link(ROUTES.support),
        link(ROUTES.systemStatus),
        link(ROUTES.news),
        link(ROUTES.referralProgram),
        link(ROUTES.partnerProgram),
      ],
      account: [
        link(ROUTES.dashboard),
        link(ROUTES.dashboardProfile),
        link(ROUTES.dashboardDocuments),
        link(ROUTES.login),
        link(ROUTES.register),
      ],
      legal: [
        link(ROUTES.terms),
        link(ROUTES.privacy),
        link(ROUTES.support),
      ],
      sections: {
        assets: t("footer.sections.assets"),
        market: t("footer.sections.market"),
        learn: t("footer.sections.learn"),
        services: t("footer.sections.services"),
        account: t("footer.sections.account"),
        legal: t("footer.sections.legal"),
      },
    };
  }, [t]);
}
