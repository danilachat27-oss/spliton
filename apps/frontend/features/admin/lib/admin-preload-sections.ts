/**
 * Warms route JS chunks in the background so the first sidebar click is faster (especially in dev).
 */
export function preloadAdminSectionModules(): void {
  if (typeof window === "undefined") return;

  const loaders = [
    () => import("@/features/admin/sections/dashboard-section"),
    () => import("@/features/admin/sections/operator-tasks-section"),
    () => import("@/features/admin/sections/users-section"),
    () => import("@/features/admin/sections/tracks-section"),
    () => import("@/features/admin/sections/rounds-section"),
    () => import("@/features/admin/sections/wallets-section"),
    () => import("@/features/admin/sections/deposits-section"),
    () => import("@/features/admin/sections/withdrawals-section"),
    () => import("@/features/admin/sections/holdings-section"),
    () => import("@/features/admin/sections/revenue-section"),
    () => import("@/features/admin/sections/secondary-market-section"),
    () => import("@/features/admin/sections/platform-revenue-section"),
    () => import("@/features/admin/sections/reports-section"),
    () => import("@/features/admin/sections/support-section"),
    () => import("@/features/admin/sections/disputes-section"),
    () => import("@/features/admin/sections/compliance-section"),
    () => import("@/features/admin/sections/settings-section"),
    () => import("@/features/admin/sections/roles-section"),
    () => import("@/features/admin/sections/audit-section"),
    () => import("@/features/admin/sections/analytics/analytics-overview-section"),
    () => import("@/features/admin/sections/analytics/analytics-finance-section"),
    () => import("@/features/admin/sections/analytics/analytics-market-section"),
    () => import("@/features/admin/sections/analytics/analytics-revenue-section"),
    () => import("@/features/admin/sections/analytics/analytics-risk-section"),
    () => import("@/features/admin/sections/analytics/analytics-users-section"),
    () => import("@/features/admin/sections/analytics/analytics-tracks-section"),
    () => import("@/features/admin/sections/analytics/analytics-operations-section"),
  ];

  const run = () => {
    for (const load of loaders) {
      void load();
    }
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 800);
  }
}

export function prefetchAdminRoutes(
  router: { prefetch: (href: string) => void },
  hrefs: string[],
): void {
  const unique = [...new Set(hrefs.map((h) => h.split("?")[0]!).filter(Boolean))];
  for (const href of unique) {
    try {
      router.prefetch(href);
    } catch {
      // ignore prefetch errors in dev
    }
  }
}
