"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { AdminSectionForbidden } from "@/features/admin/components/admin-section-forbidden";
import { AdminSectionPanel } from "@/features/admin/components/admin-section-layout";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  type AdminSectionId,
} from "@/features/admin/config/admin-sections";
import {
  getVisibleAnalyticsNav,
  type AnalyticsSectionId,
} from "@/features/admin/analytics/config/analytics-nav";
import { AdminAnalyticsCompactNav } from "@/features/admin/analytics/ui/admin-analytics-compact-nav";

type AdminAnalyticsLayoutProps = {
  activeSection: AnalyticsSectionId;
  children: React.ReactNode;
};

/** @deprecated Prefer AdminAnalyticsPageShell — оставлен для постепенной миграции секций */
export function AdminAnalyticsLayout({ activeSection, children }: AdminAnalyticsLayoutProps) {
  return (
    <div className="space-y-5">
      <AdminAnalyticsCompactNav activeSection={activeSection} />
      {children}
    </div>
  );
}

export function AdminAnalyticsGuard({
  sectionId,
  children,
}: {
  sectionId: AnalyticsSectionId;
  children: React.ReactNode;
}) {
  const a = useAdminI18n();
  const { user } = useAuth();
  const nav = getVisibleAnalyticsNav(user?.roles);
  const allowed = nav.some((n) => n.id === sectionId);

  if (!allowed) {
    const sectionMap: Record<AnalyticsSectionId, AdminSectionId> = {
      analyticsOverview: "analyticsOverview",
      analyticsFinance: "analyticsFinance",
      analyticsUsers: "analyticsUsers",
      analyticsTracks: "analyticsTracks",
      analyticsMarket: "analyticsMarket",
      analyticsRevenue: "analyticsRevenue",
      analyticsRisk: "analyticsRisk",
      analyticsOperations: "analyticsOperations",
    };
    return (
      <AdminSectionForbidden sectionTitle={a.adminSectionLabel(sectionMap[sectionId])} />
    );
  }

  return <>{children}</>;
}
