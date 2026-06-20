"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";

import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ADMIN_METRIC_NA_LABEL } from "@/features/admin/lib/admin-format";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminListRow } from "@/features/admin/lib/admin-ui";
import { AdminDepositNetworkSettingsPanel } from "@/features/admin/sections/admin-deposit-network-settings-panel";
import { AdminDepositAddressPoolPanel } from "@/features/admin/sections/admin-deposit-address-pool-panel";
import {
  AdminTreasuryAccountsPanel,
  AdminTreasuryLimitsPanel,
  AdminTreasuryReconciliationPanel,
  AdminTreasurySafetyPanel,
} from "@/features/admin/sections/admin-treasury-operations-panels";
import { AdminDetailDrawer, AdminSectionInfoHint } from "@/features/admin/ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TreasuryConsole = {
  hotWallet: {
    configured: boolean;
    address: string | null;
    balanceExpected: string;
    balanceObserved: string | null;
    minThreshold: string | null;
    maxThreshold: string | null;
    lastReconciledAt: string | null;
  } | null;
  coldWallet: {
    configured: boolean;
    address: string | null;
    note: string;
  } | null;
  pendingWithdrawals: number;
  approvalQueue: number;
  dailyOutflowUsdt: string;
  openDiscrepancyCount: number;
  featureFlags: Record<string, boolean>;
  limits: Record<string, unknown>;
  depositIngestion: { status: string; lastRunAt: string | null } | null;
};

const TREASURY_MODULES = [
  { id: "safety", titleKey: "admin.treasury.module.safety", descKey: "admin.treasury.module.safetyDesc" },
  {
    id: "reconciliation",
    titleKey: "admin.treasury.module.reconciliation",
    descKey: "admin.treasury.module.reconciliationDesc",
  },
  { id: "accounts", titleKey: "admin.treasury.module.accounts", descKey: "admin.treasury.module.accountsDesc" },
  { id: "limits", titleKey: "admin.treasury.module.limits", descKey: "admin.treasury.module.limitsDesc" },
  {
    id: "deposit-network",
    titleKey: "admin.treasury.module.depositNetwork",
    descKey: "admin.treasury.module.depositNetworkDesc",
  },
  {
    id: "address-pool",
    titleKey: "admin.treasury.module.addressPool",
    descKey: "admin.treasury.module.addressPoolDesc",
  },
] as const;

type TreasuryModuleId = (typeof TREASURY_MODULES)[number]["id"];

export function AdminTreasurySection() {
  const a = useAdminI18n();
  const client = useAdminApi();

  const [data, setData] = React.useState<TreasuryConsole | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [hotCheckMessage, setHotCheckMessage] = React.useState<string | null>(null);
  const [activeModule, setActiveModule] = React.useState<TreasuryModuleId | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    void client
      .get<TreasuryConsole>(`${ADMIN_API_PATHS.treasury}/console`)
      .catch(() => {
        setError(true);
        return null;
      })
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const checkHotWallet = () => {
    setHotCheckMessage(null);
    void client
      .post<{ alertsCreated?: number }>(`${ADMIN_API_PATHS.treasury}/hot-wallet/check-thresholds`)
      .then((r) =>
        setHotCheckMessage(
          a.t("admin.treasury.hotCheckDone").replace("{count}", String(r.alertsCreated ?? 0)),
        ),
      )
      .catch((e) => setHotCheckMessage(localizedAdminError(e)));
  };

  const activeModuleMeta = TREASURY_MODULES.find((m) => m.id === activeModule);

  return (
    <AdminSectionShell
      sectionId="treasury"
      title={a.t("admin.treasury.title")}
      actions={<AdminSectionRefreshButton onClick={load} />}
    >
      <AdminSectionInfoHint>{a.t("admin.treasury.subtitle")}</AdminSectionInfoHint>

      <AdminSectionPanel>
        <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {a.t("admin.treasury.rehearsalNote")}
        </p>

        <AdminSectionDataArea loading={loading} error={error} onRetry={load}>
          {data ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className={cn(ADMIN_SECTION_TILE, "text-sm")}>
                  <p className="font-semibold text-zinc-100">{a.t("admin.treasury.hotWallet")}</p>
                  <p className="mt-1 break-all font-mono text-[10px] text-zinc-400">
                    {data.hotWallet?.configured
                      ? data.hotWallet.address
                      : a.t("admin.treasury.notConfiguredBoot")}
                  </p>
                  <p className="mt-2 tabular-nums text-zinc-200">
                    {a.t("admin.table.expected")}: {data.hotWallet?.balanceExpected ?? ADMIN_METRIC_NA_LABEL} ·{" "}
                    {a.t("admin.table.observed")}: {data.hotWallet?.balanceObserved ?? ADMIN_METRIC_NA_LABEL}
                  </p>
                  {data.hotWallet?.minThreshold ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      {a
                        .t("admin.treasury.minMax")
                        .replace("{min}", data.hotWallet.minThreshold)
                        .replace("{max}", data.hotWallet.maxThreshold ?? ADMIN_METRIC_NA_LABEL)}
                    </p>
                  ) : null}
                </div>

                <div className={cn(ADMIN_SECTION_TILE, "text-sm")}>
                  <p className="font-semibold text-zinc-100">{a.t("admin.treasury.coldWallet")}</p>
                  <p className="mt-1 break-all font-mono text-[10px] text-zinc-400">
                    {data.coldWallet?.configured
                      ? data.coldWallet.address
                      : a.t("admin.treasury.notConfigured")}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {data.coldWallet?.note || a.t("admin.treasury.coldWalletManual")}
                  </p>
                </div>

                <div className={cn(ADMIN_SECTION_TILE, "text-sm")}>
                  <p className="font-semibold text-zinc-100">{a.t("admin.treasury.queues")}</p>
                  <ul className="mt-2 space-y-1 text-zinc-300">
                    <li>
                      {a.t("admin.treasury.pendingWithdrawalsLabel")}:{" "}
                      <Link href={ROUTES.adminWithdrawals} className="underline">
                        {data.pendingWithdrawals}
                      </Link>
                    </li>
                    <li>
                      {a.t("admin.treasury.approvalQueue")}: {data.approvalQueue}
                    </li>
                    <li>
                      {a.t("admin.treasury.dailyOutflow")}: {data.dailyOutflowUsdt}
                    </li>
                    <li>
                      {a.t("admin.treasury.openDiscrepancies")}: {data.openDiscrepancyCount}
                    </li>
                  </ul>
                  {data.depositIngestion ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      {a.t("admin.systemStatus.depositIngestion")}: {data.depositIngestion.status}
                      {data.depositIngestion.lastRunAt
                        ? ` · ${new Date(data.depositIngestion.lastRunAt).toLocaleString("ru-RU")}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              </div>

              {hotCheckMessage ? <p className="text-xs text-zinc-400">{hotCheckMessage}</p> : null}

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {a.t("admin.treasury.manage")}
                </p>
                <ul className="space-y-1.5">
                  {TREASURY_MODULES.map((module) => (
                    <li key={module.id}>
                      <button
                        type="button"
                        className={cn(
                          adminListRow(),
                          "flex w-full items-center gap-3 text-left transition-all hover:ring-1 hover:ring-zinc-700",
                        )}
                        onClick={() => setActiveModule(module.id)}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-zinc-100">
                            {a.t(module.titleKey)}
                          </span>
                          <span className="mt-0.5 block text-xs text-zinc-500">{a.t(module.descKey)}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-zinc-500" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminDetailDrawer
        open={activeModule != null}
        onOpenChange={(open) => {
          if (!open) setActiveModule(null);
        }}
        wide={activeModule === "deposit-network" || activeModule === "accounts" || activeModule === "address-pool"}
        title={activeModuleMeta ? a.t(activeModuleMeta.titleKey) : a.t("admin.treasury.title")}
        subtitle={activeModuleMeta ? a.t(activeModuleMeta.descKey) : undefined}
      >
        {activeModule === "safety" ? (
          <AdminTreasurySafetyPanel featureFlags={data?.featureFlags ?? {}} onCheckHotWallet={checkHotWallet} />
        ) : null}
        {activeModule === "reconciliation" ? (
          <AdminTreasuryReconciliationPanel
            openDiscrepancyCount={data?.openDiscrepancyCount ?? 0}
            onRefreshConsole={load}
          />
        ) : null}
        {activeModule === "accounts" ? <AdminTreasuryAccountsPanel embedded /> : null}
        {activeModule === "limits" ? (
          <AdminTreasuryLimitsPanel
            embedded
            initialLimits={data?.limits as Parameters<typeof AdminTreasuryLimitsPanel>[0]["initialLimits"]}
          />
        ) : null}
        {activeModule === "deposit-network" ? <AdminDepositNetworkSettingsPanel embedded /> : null}
        {activeModule === "address-pool" ? <AdminDepositAddressPoolPanel embedded /> : null}
      </AdminDetailDrawer>
    </AdminSectionShell>
  );
}
