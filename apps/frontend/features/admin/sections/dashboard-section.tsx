"use client";



import * as React from "react";



import { AdminDashboardOverview } from "@/features/admin/components/dashboard/admin-dashboard-overview";

import { AdminPageShell } from "@/features/admin/components/admin-page-shell";

import { useAdminApi } from "@/features/admin/hooks/use-admin-api";

import { useAnalyticsPeriod } from "@/features/admin/analytics/hooks/use-analytics-period";

import type { AnalyticsDashboardTrends } from "@/features/admin/analytics/types";


import type { AdminDashboardAlert } from "@/features/admin/mocks/admin-dashboard.mock";

import type { AdminRecentAction } from "@/features/admin/mocks/admin-dashboard.mock";

import type { AdminDashboardKpis } from "@/features/admin/mocks/admin-dashboard.mock";

import type { AdminDepositListItem } from "@/features/admin/mocks/admin-finance.mock";

import type { AdminWithdrawalListItem } from "@/features/admin/mocks/admin-finance.mock";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {

  getAdminDashboardAlerts,

  getAdminDashboardKpis,

  getAdminDashboardTasks,

  getAdminDashboardTrends,

  getAdminRecentActions,

  getAdminRecentDeposits,

  getAdminRecentWithdrawals,

} from "@/services/admin/adminDashboard.service";

import { resolveDashboardPersona } from "@/features/admin/config/admin-rbac";
import { useAuth } from "@/components/providers/auth-provider";
import { raceWithTimeout } from "@/lib/fetch-with-timeout";
import { AdminErrorState } from "@/features/admin/ui/admin-error-state";
import { AdminLoadingState } from "@/features/admin/ui/admin-loading-state";

import {

  getAdminDataCache,

  setAdminDataCache,

} from "@/features/admin/lib/admin-data-cache";



type DashboardSnapshot = {

  kpis: AdminDashboardKpis;

  trends: AnalyticsDashboardTrends | null;

  tasks: Array<{ id: string; label: string; count: number; href: string }>;

  alerts: AdminDashboardAlert[];

  actions: AdminRecentAction[];

  deposits: AdminDepositListItem[];

  withdrawals: AdminWithdrawalListItem[];

};



export function DashboardSection() {
  const a = useAdminI18n();
  const { user } = useAuth();
  const persona = resolveDashboardPersona(user?.roles);
  const client = useAdminApi();

  const { period, setPeriod, query, customFrom, customTo, setCustomDates } = useAnalyticsPeriod("30d");

  const [kpis, setKpis] = React.useState<AdminDashboardKpis | null>(null);

  const [trends, setTrends] = React.useState<AnalyticsDashboardTrends | null>(null);

  const [tasks, setTasks] = React.useState<Array<{ id: string; label: string; count: number; href: string }>>([]);

  const [alerts, setAlerts] = React.useState<AdminDashboardAlert[]>([]);

  const [actions, setActions] = React.useState<AdminRecentAction[]>([]);

  const [deposits, setDeposits] = React.useState<AdminDepositListItem[]>([]);

  const [withdrawals, setWithdrawals] = React.useState<AdminWithdrawalListItem[]>([]);

  const dashboardCacheKey = `dashboard:${JSON.stringify(query)}`;



  const [loading, setLoading] = React.useState(

    () => !getAdminDataCache<DashboardSnapshot>(dashboardCacheKey),

  );

  const [error, setError] = React.useState(false);



  const load = React.useCallback(() => {

    const snapshot = getAdminDataCache<DashboardSnapshot>(dashboardCacheKey);

    if (!snapshot) setLoading(true);

    setError(false);

    raceWithTimeout(
      Promise.all([
      getAdminDashboardKpis(client, query),

      getAdminDashboardTrends(query, client),

      getAdminDashboardTasks(client),

      getAdminDashboardAlerts(client),

      getAdminRecentActions(client),

      getAdminRecentDeposits(client),

      getAdminRecentWithdrawals(client),

    ]),
      20_000,
      "Dashboard",
    )

      .then(([k, tr, t, a, act, dep, wd]) => {

        const next: DashboardSnapshot = {

          kpis: k,

          trends: tr,

          tasks: t,

          alerts: a,

          actions: act,

          deposits: dep,

          withdrawals: wd,

        };

        setAdminDataCache(dashboardCacheKey, next);

        setKpis(k);

        setTrends(tr);

        setTasks(t);

        setAlerts(a);

        setActions(act);

        setDeposits(dep);

        setWithdrawals(wd);

      })

      .catch(() => setError(true))

      .finally(() => setLoading(false));

  }, [client, query, dashboardCacheKey]);



  React.useEffect(() => {

    load();

  }, [load]);



  if (loading && !kpis) {

    return (

      <AdminPageShell contained className="bg-zinc-950">

        <AdminLoadingState label={a.t("admin.loading.overview")} centered />

      </AdminPageShell>

    );

  }

  if (error || !kpis) {

    return (

      <AdminPageShell contained className="bg-zinc-950">

        <AdminErrorState onRetry={load} />

      </AdminPageShell>

    );

  }



  return (

    <AdminPageShell contained className="bg-zinc-950">

      <AdminDashboardOverview
        title={a.adminSectionLabel("dashboard")}
        persona={persona}
        period={period}
        onPeriodChange={setPeriod}
        customFrom={customFrom}
        customTo={customTo}
        onCustomDatesChange={setCustomDates}

        onRefresh={load}

        kpis={kpis}

        trends={trends}

        tasks={tasks}

        alerts={alerts}

        actions={actions}

        deposits={deposits}

        withdrawals={withdrawals}

      />

    </AdminPageShell>

  );

}

