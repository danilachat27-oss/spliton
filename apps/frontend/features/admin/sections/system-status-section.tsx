"use client";

import * as React from "react";
import { ExternalLink } from "@/lib/lucide";
import Link from "next/link";

import {
  AdminSectionRefreshButton,
  AdminSectionShell,
  AdminSectionTabBar,
  AdminSectionPanel,
} from "@/features/admin/components/admin-section-layout";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { AdminSystemAnnouncementsPanel } from "@/features/admin/sections/admin-system-announcements-panel";
import {
  AdminSystemStatusComponentsPanel,
  type SystemStatusComponentRow,
} from "@/features/admin/sections/admin-system-status-components-panel";
import {
  AdminSystemStatusIncidentsPanel,
  type SystemStatusIncidentRow,
} from "@/features/admin/sections/admin-system-status-incidents-panel";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ROUTES } from "@/constants/routes";

type OperationsStatus = {
  generatedAt: string;
  depositIngestion: {
    workerEnabled: boolean;
    providerOk: boolean;
    healthy: boolean;
    stuckDeposits: number;
    lastRunAt: string | null;
  };
  reportWorker: {
    workerEnabled: boolean;
    healthy: boolean;
    stuckProcessing: number;
    failedLast24h: number;
  };
  finance: {
    stuckWithdrawals: number;
    openCriticalAlerts: number;
    openIncidents: number;
  };
};

type TabId = "components" | "incidents" | "announcements";

export function SystemStatusSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [tab, setTab] = React.useState<TabId>("components");
  const [components, setComponents] = React.useState<SystemStatusComponentRow[]>([]);
  const [incidents, setIncidents] = React.useState<SystemStatusIncidentRow[]>([]);
  const [ops, setOps] = React.useState<OperationsStatus | null>(null);
  const [opsError, setOpsError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    setOpsError(false);
    void Promise.allSettled([
      client.get<{ items: SystemStatusComponentRow[] }>(ADMIN_API_PATHS.systemStatusComponents),
      client.get<{ items: SystemStatusIncidentRow[] }>(ADMIN_API_PATHS.systemStatusIncidents),
      client.get<OperationsStatus>(ADMIN_API_PATHS.operationsStatus),
    ])
      .then(([componentsResult, incidentsResult, opsResult]) => {
        if (componentsResult.status === "rejected" || incidentsResult.status === "rejected") {
          setError(true);
          return;
        }
        setComponents(componentsResult.value.items);
        setIncidents(incidentsResult.value.items);
        if (opsResult.status === "fulfilled") {
          setOps(opsResult.value);
        } else {
          setOps(null);
          setOpsError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const activeIncidents = incidents.filter((item) => item.status !== "resolved").length;

  return (
    <AdminSectionShell
      sectionId="systemStatus"
      title={a.adminSectionLabel("systemStatus")}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={ROUTES.systemStatus}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-800/60 px-3.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-700/80"
          >
            Публичная страница
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
          <AdminSectionRefreshButton onClick={load} />
        </div>
      }
      banner={
        <div className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-100">
          Изменения компонентов и инцидентов сразу попадают на{" "}
          <Link href={ROUTES.systemStatus} className="font-semibold underline-offset-2 hover:underline">
            /system-status
          </Link>
          . Баннеры в продукте управляются отдельно во вкладке «Объявления».
        </div>
      }
    >
      {opsError ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {a.t("admin.ui.widgetUnavailable")}
        </p>
      ) : null}
      {ops ? (
        <AdminSectionPanel>
          <h3 className="text-sm font-semibold text-zinc-100">Операционный мониторинг</h3>
          <p className="text-xs text-zinc-500">
            Автоматические health-checks. Ручные статусы ниже имеют приоритет на публичной странице до
            следующей синхронизации воркера (каждые 5 мин).
          </p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-xs text-zinc-500">{a.t("admin.systemStatus.depositIngestion")}</dt>
              <dd className="font-medium">{ops.depositIngestion.healthy ? a.t("admin.systemStatus.ok") : a.t("admin.systemStatus.degraded")}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{a.t("admin.systemStatus.reportWorker")}</dt>
              <dd className="font-medium">{ops.reportWorker.healthy ? a.t("admin.systemStatus.ok") : a.t("admin.systemStatus.degraded")}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Stuck withdrawals</dt>
              <dd className="font-medium">{ops.finance.stuckWithdrawals}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Critical alerts</dt>
              <dd className="font-medium">{ops.finance.openCriticalAlerts}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Open incidents</dt>
              <dd className="font-medium">{ops.finance.openIncidents}</dd>
            </div>
          </dl>
          <p className="text-xs text-zinc-500">
            Обновлено: {new Date(ops.generatedAt).toLocaleString("ru-RU")}
          </p>
        </AdminSectionPanel>
      ) : null}

      <AdminSectionTabBar
        activeId={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: "components", label: "Компоненты", count: components.length },
          { id: "incidents", label: "Инциденты", count: activeIncidents },
          { id: "announcements", label: "Объявления", count: undefined },
        ]}
      />

      {tab === "components" ? (
        <AdminSystemStatusComponentsPanel
          components={components}
          loading={loading}
          error={error}
          onReload={load}
        />
      ) : null}

      {tab === "incidents" ? (
        <AdminSystemStatusIncidentsPanel
          components={components}
          incidents={incidents}
          loading={loading}
          error={error}
          onReload={load}
        />
      ) : null}

      {tab === "announcements" ? <AdminSystemAnnouncementsPanel /> : null}
    </AdminSectionShell>
  );
}
