"use client";

import { useMemo } from "react";

import {
  dashboardNavItems,
  type DashboardNavItem,
  type DashboardNavSubItem,
} from "@/components/dashboard/dashboard-nav";
import { useI18n } from "@/components/providers/i18n-provider";

function childKey(parentId: string, href: string): string {
  const slug = href.replace(/^\//, "").replace(/\//g, ".") || "root";
  return `nav.${parentId}.${slug}`;
}

function localizeSubItem(
  parentId: string,
  item: DashboardNavSubItem,
  t: (key: string, fallback?: string) => string,
): DashboardNavSubItem {
  const base = childKey(parentId, item.href);
  return {
    ...item,
    label: t(`${base}.label`, item.label),
    description: t(`${base}.desc`, item.description),
  };
}

function localizeNavItem(
  item: DashboardNavItem,
  t: (key: string, fallback?: string) => string,
): DashboardNavItem {
  return {
    ...item,
    label: t(`nav.${item.id}`, item.label),
    megaTeaser: item.megaTeaser ? t(`nav.teaser.${item.id}`, item.megaTeaser) : undefined,
    children: item.children?.map((c) => localizeSubItem(item.id, c, t)),
  };
}

/** Top nav labels (fallback = copy in dashboard-nav.ts). */
export function useLocalizedNavItems(): DashboardNavItem[] {
  const { t, locale } = useI18n();
  return useMemo(
    () => dashboardNavItems.map((item) => localizeNavItem(item, t)),
    [t, locale],
  );
}
