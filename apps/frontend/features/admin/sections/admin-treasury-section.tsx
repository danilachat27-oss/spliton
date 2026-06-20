"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "@/lib/lucide";

import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  ADMIN_METRIC_NA_LABEL,
  formatUsdtAmount,
  isAdminMetricEmpty,
} from "@/features/admin/lib/admin-format";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import {
  ADMIN_SECTION_KPI_GRID,
  ADMIN_SECTION_NOTICE,
  ADMIN_SECTION_TILE,
} from "@/features/admin/lib/admin-section-styles";
import { AdminDepositNetworkSettingsPanel } from "@/features/admin/sections/admin-deposit-network-settings-panel";
import { AdminDepositAddressPoolPanel } from "@/features/admin/sections/admin-deposit-address-pool-panel";
import {
  AdminTreasuryAccountsPanel,
  AdminTreasuryLimitsPanel,
  AdminTreasuryReconciliationPanel,
  AdminTreasurySafetyPanel,
} from "@/features/admin/sections/admin-treasury-operations-panels";
import { AdminDetailDrawer } from "@/features/admin/ui";
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

function StatTile({
  label,
  value,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  href?: string;
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "danger"
          ? "text-rose-400"
          : tone === "info"
            ? "text-sky-400"
            : "text-zinc-100";
  const empty = isAdminMetricEmpty(value);

  const body = (
    <div className={cn(ADMIN_SECTION_TILE, "flex min-h-[5.5rem] flex-col justify-between gap-2")}>
      <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-zinc-500">{label}</p>
      <p
        className={cn(
          "tabular-nums tracking-tight",
          empty ? "text-base font-medium text-zinc-500" : cn("text-2xl font-semibold", valueClass),
        )}
      >
        {empty ? ADMIN_METRIC_NA_LABEL : value}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {body}
      </Link>
    );
  }

  return body;
}

export function AdminTreasurySection() {
  const a = useAdminI18n();
  const client = useAdminApi();

  const [data, setData] = React.useState<TreasuryConsole | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [hotCheckMessage, setHotCheckMessage] = React.useState<string | null>(null);
  const [activeModule, setActiveModule] = React.useState<TreasuryModuleId | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const consoleData = await client.get<TreasuryConsole>(`${ADMIN_API_PATHS.treasury}/console`);
      setData(consoleData);
    } catch (e) {
      setError(localizedAdminError(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void load();
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
  const wideDrawer =
    activeModule === "deposit-network" || activeModule === "accounts" || activeModule === "address-pool";

  return (
    <AdminSectionShell
      sectionId="treasury"
      title={a.t("admin.treasury.title")}
      infoHint={a.t("admin.treasury.subtitle")}
      actions={<AdminSectionRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <AdminSectionPanel className="min-w-0 space-y-5">
        {data && !loading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            <StatTile
              label={a.t("admin.treasury.pendingWithdrawalsLabel")}
              value={String(data.pendingWithdrawals)}
              tone={data.pendingWithdrawals > 0 ? "warning" : "neutral"}
              href={ROUTES.adminWithdrawals}
            />
            <StatTile
              label={a.t("admin.treasury.approvalQueue")}
              value={String(data.approvalQueue)}
              tone={data.approvalQueue > 0 ? "warning" : "neutral"}
            />
            <StatTile
              label={a.t("admin.treasury.dailyOutflow")}
              value={formatUsdtAmount(data.dailyOutflowUsdt)}
              tone="info"
            />
            <StatTile
              label={a.t("admin.treasury.openDiscrepancies")}
              value={String(data.openDiscrepancyCount)}
              tone={data.openDiscrepancyCount > 0 ? "danger" : "success"}
            />
          </div>
        ) : loading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(ADMIN_SECTION_TILE, "h-24 animate-pulse bg-zinc-800/50")} />
            ))}
          </div>
        ) : null}

        {data ? (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-zinc-900/40 px-4 py-3 text-sm">
            <Link
              href={ROUTES.adminWithdrawals}
              className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-[#B7F500]"
            >
              {a.t("admin.section.withdrawals")}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href={ROUTES.adminDeposits}
              className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-[#B7F500]"
            >
              {a.t("admin.section.deposits")}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href={ROUTES.adminOperatorTasks}
              className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-[#B7F500]"
            >
              {a.t("admin.section.operatorTasks")}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        ) : null}

        <AdminSectionDataArea
          loading={loading && !data}
          error={error}
          onRetry={() => void load()}
          loadingLabel={a.t("admin.empty.loading")}
        >
          {data ? (
            <div className="space-y-6">
              <div className="grid gap-3 lg:grid-cols-3">
                <div className={cn(ADMIN_SECTION_TILE, "space-y-2 text-sm")}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    {a.t("admin.treasury.hotWallet")}
                  </p>
                  <p className="break-all font-mono text-[11px] text-zinc-400">
                    {data.hotWallet?.configured
                      ? data.hotWallet.address
                      : a.t("admin.treasury.notConfigured")}
                  </p>
                  <div className="space-y-1 text-xs text-zinc-500">
                    <p>
                      {a.t("admin.table.expected")}:{" "}
                      <span className="tabular-nums text-emerald-400">
                        {data.hotWallet?.balanceExpected
                          ? formatUsdtAmount(data.hotWallet.balanceExpected)
                          : ADMIN_METRIC_NA_LABEL}
                      </span>
                    </p>
                    <p>
                      {a.t("admin.table.observed")}:{" "}
                      <span className="tabular-nums text-zinc-300">
                        {data.hotWallet?.balanceObserved
                          ? formatUsdtAmount(data.hotWallet.balanceObserved)
                          : ADMIN_METRIC_NA_LABEL}
                      </span>
                    </p>
                  </div>
                  {data.hotWallet?.minThreshold ? (
                    <p className="text-xs text-zinc-500">
                      {a
                        .t("admin.treasury.minMax")
                        .replace("{min}", formatUsdtAmount(data.hotWallet.minThreshold))
                        .replace(
                          "{max}",
                          data.hotWallet.maxThreshold
                            ? formatUsdtAmount(data.hotWallet.maxThreshold)
                            : ADMIN_METRIC_NA_LABEL,
                        )}
                    </p>
                  ) : null}
                </div>

                <div className={cn(ADMIN_SECTION_TILE, "space-y-2 text-sm")}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    {a.t("admin.treasury.coldWallet")}
                  </p>
                  <p className="break-all font-mono text-[11px] text-zinc-400">
                    {data.coldWallet?.configured
                      ? data.coldWallet.address
                      : a.t("admin.treasury.notConfigured")}
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    {data.coldWallet?.note || a.t("admin.treasury.coldWalletManual")}
                  </p>
                </div>

                <div className={cn(ADMIN_SECTION_TILE, "space-y-2 text-sm")}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    {a.t("admin.systemStatus.depositIngestion")}
                  </p>
                  {data.depositIngestion ? (
                    <>
                      <p className="text-sm font-medium text-zinc-200">{data.depositIngestion.status}</p>
                      <p className="text-xs text-zinc-500">
                        {data.depositIngestion.lastRunAt
                          ? new Date(data.depositIngestion.lastRunAt).toLocaleString(a.locale)
                          : ADMIN_METRIC_NA_LABEL}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-500">{ADMIN_METRIC_NA_LABEL}</p>
                  )}
                </div>
              </div>

              {hotCheckMessage ? (
                <div className={cn(ADMIN_SECTION_NOTICE, "text-xs text-zinc-400")}>{hotCheckMessage}</div>
              ) : null}

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {a.t("admin.treasury.manage")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TREASURY_MODULES.map((module) => (
                    <button
                      key={module.id}
                      type="button"
                      className={cn(
                        ADMIN_SECTION_TILE,
                        "flex w-full items-start gap-3 text-left transition-colors hover:bg-zinc-900/70",
                      )}
                      onClick={() => setActiveModule(module.id)}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-zinc-100">
                          {a.t(module.titleKey)}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                          {a.t(module.descKey)}
                        </span>
                      </span>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
                    </button>
                  ))}
                </div>
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
        borderless
        wide={wideDrawer}
        widthClassName={wideDrawer ? "w-[min(920px,100vw)]" : undefined}
        title={activeModuleMeta ? a.t(activeModuleMeta.titleKey) : a.t("admin.treasury.title")}
        subtitle={activeModuleMeta ? a.t(activeModuleMeta.descKey) : undefined}
      >
        {activeModule === "safety" ? (
          <AdminTreasurySafetyPanel featureFlags={data?.featureFlags ?? {}} onCheckHotWallet={checkHotWallet} />
        ) : null}
        {activeModule === "reconciliation" ? (
          <AdminTreasuryReconciliationPanel
            openDiscrepancyCount={data?.openDiscrepancyCount ?? 0}
            onRefreshConsole={() => void load()}
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
