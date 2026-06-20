import { ROUTES } from "@/constants/routes";

export type AssetTabItem = {
  label: string;
  href: string;
};

export function getAssetsTabs(t: (key: string) => string): AssetTabItem[] {
  return [
    { label: t("assets.tabs.overview"), href: ROUTES.dashboardOverview },
    { label: t("assets.tabs.metrics"), href: ROUTES.dashboardMetrics },
    { label: t("assets.tabs.activity"), href: ROUTES.dashboardActivity },
    { label: t("assets.tabs.positions"), href: ROUTES.dashboardPositions },
  ];
}

/** @deprecated use getAssetsTabs(t) */
export const assetsTabs: AssetTabItem[] = [
  { label: "Сводка", href: ROUTES.dashboardOverview },
  { label: "Метрики", href: ROUTES.dashboardMetrics },
  { label: "Позиции", href: ROUTES.dashboardPositions },
  { label: "Активность", href: ROUTES.dashboardActivity },
];
