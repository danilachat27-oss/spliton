"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import type { AnalyticsSectionId } from "@/features/admin/analytics/config/analytics-nav";
import { AdminAnalyticsCompactNav } from "./admin-analytics-compact-nav";
import { AdminAnalyticsTabs } from "./admin-analytics-tabs";
import type { AnalyticsPageTab } from "@/features/admin/analytics/config/analytics-page-tabs";
import { useAdminSectionTab } from "@/features/admin/hooks/use-admin-section-tab";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { isBusinessAnalyst } from "@/features/admin/config/admin-rbac";
import { AdminPageHeader } from "@/features/admin/ui/admin-page-header";
import { AdminReadOnlyBanner } from "@/features/admin/ui/admin-read-only-banner";

type Props = {
  activeSection: AnalyticsSectionId;
  title: string;
  description: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  pageTabs: readonly AnalyticsPageTab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
};

export function AdminAnalyticsPageShell({
  activeSection,
  title,
  description,
  breadcrumbs,
  actions,
  filters,
  pageTabs,
  defaultTab = "overview",
  children,
}: Props) {
  const { user } = useAuth();
  const a = useAdminI18n();
  const analyst = isBusinessAnalyst(user?.roles);
  const tabIds = pageTabs.map((t) => t.id);
  const [tab, setTab] = useAdminSectionTab(tabIds, defaultTab);

  return (
    <AdminPageShell>
      {analyst ? (
        <AdminReadOnlyBanner area={a.t("admin.analytics.readOnlyArea")} className="mb-2" />
      ) : null}
      <AdminPageHeader title={title} description={description} breadcrumbs={breadcrumbs} actions={actions} />
      <div className="mt-4 space-y-4">
        {filters ? <div className="relative z-30 overflow-visible">{filters}</div> : null}
        <AdminAnalyticsCompactNav activeSection={activeSection} className="relative z-0" />
        <AdminAnalyticsTabs tabs={pageTabs} activeId={tab} onChange={setTab} className="relative z-0" />
        <div className="relative z-0 pt-2">{children(tab)}</div>
      </div>
    </AdminPageShell>
  );
}
