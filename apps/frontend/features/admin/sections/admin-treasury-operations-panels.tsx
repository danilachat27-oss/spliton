"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminBtnOutline, adminFieldInput } from "@/features/admin/lib/admin-ui";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAuth } from "@/components/providers/auth-provider";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ADMIN_METRIC_NA_LABEL, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_NOTICE, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { AdminDataTable, AdminFormField, type AdminColumn } from "@/features/admin/ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TreasuryAccount = {
  id: string;
  type: string;
  label: string;
  asset: string;
  network: string | null;
  address: string | null;
  status: string;
  balanceExpected: string;
  balanceObserved: string | null;
  lastReconciledAt: string | null;
};

type OperationalLimits = {
  userDailyWithdrawalUsdt: string;
  userMonthlyWithdrawalUsdt: string;
  userDailyTradeUsdt: string;
  maxOpenListingUsdt: string;
  maxFailedWithdrawalAttempts: number;
  maxAutoCreditDepositUsdt: string;
  maxAutoCompleteWithdrawalUsdt: string;
  mediumWithdrawalUsdt: string;
  largeWithdrawalUsdt: string;
  hotWalletMaxDailyOutflowUsdt: string;
  reportExportMaxRows: number;
};

type ReconciliationDryRun = {
  dryRun: boolean;
  discrepancyCount: number;
  items: Array<{
    type: string;
    expected: string;
    observed: string;
    delta: string;
    severity: string;
  }>;
};

type DiscrepancyRow = {
  id: string;
  deltaAmount: string;
  severity: string;
  status: string;
  treasuryAccount: { type: string; label: string };
};

const KILL_SWITCH_LABELS: Record<string, string> = {
  disableWithdrawalsImmediately: "Экстренная пауза выводов",
  disableDepositsImmediately: "Экстренная пауза депозитов",
  disableDepositsCredit: "Зачисление депозитов отключено",
  disablePrimaryPurchasesImmediately: "Первичный рынок отключён",
  disableSecondaryTradingImmediately: "Вторичный рынок отключён",
  disableRevenueDistributionImmediately: "Распределение дохода отключено",
  disableReportDownloads: "Скачивание отчётов отключено",
  enableMaintenanceMode: "Режим обслуживания",
};

function treasuryDiscrepancyTypeLabel(
  admin: ReturnType<typeof useAdminI18n>,
  type: string,
): string {
  return admin.adminTreasuryTypeLabel(type) || admin.ledgerOperationLabel(type);
}

export function AdminTreasuryAccountsPanel({ embedded = false }: { embedded?: boolean }) {
  const admin = useAdminI18n();
  const client = useAdminApi();
  const [accounts, setAccounts] = React.useState<TreasuryAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [observedDraft, setObservedDraft] = React.useState<Record<string, string>>({});
  const [reasonDraft, setReasonDraft] = React.useState("");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    void client
      .get<TreasuryAccount[]>(`${ADMIN_API_PATHS.treasury}/accounts`)
      .then((rows) => {
        setAccounts(rows);
        const draft: Record<string, string> = {};
        for (const row of rows) draft[row.id] = row.balanceObserved ?? row.balanceExpected;
        setObservedDraft(draft);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const saveObserved = async (id: string) => {
    if (!reasonDraft.trim()) {
      setMessage(admin.t("admin.treasury.accounts.auditRequired"));
      return;
    }
    setSavingId(id);
    setMessage(null);
    try {
      await client.patch(`${ADMIN_API_PATHS.treasury}/accounts/${id}/observed-balance`, {
        observedBalance: observedDraft[id] ?? "0",
        reason: reasonDraft.trim(),
      });
      setMessage(admin.t("admin.treasury.observedUpdated"));
      setReasonDraft("");
      load();
    } catch (e) {
      setMessage(localizedAdminError(e));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">{admin.t("admin.treasury.accounts.loading")}</p>;
  }

  const columns: AdminColumn<TreasuryAccount>[] = [
    {
      key: "type",
      header: admin.t("admin.table.type"),
      render: (account) => (
        <span className="font-medium text-zinc-200">{admin.adminTreasuryTypeLabel(account.type)}</span>
      ),
    },
    {
      key: "expected",
      header: admin.t("admin.table.expected"),
      render: (account) => (
        <span className="tabular-nums text-emerald-400">{formatUsdtAmount(account.balanceExpected)}</span>
      ),
    },
    {
      key: "observed",
      header: admin.t("admin.table.observed"),
      render: (account) => (
        <Input
          className={cn(adminFieldInput, "h-8 w-28 tabular-nums")}
          value={observedDraft[account.id] ?? ""}
          onChange={(e) =>
            setObservedDraft((prev) => ({ ...prev, [account.id]: e.target.value }))
          }
        />
      ),
    },
    {
      key: "address",
      header: admin.table.address,
      render: (account) => (
        <span className="max-w-[140px] truncate font-mono text-[10px] text-zinc-500">
          {account.address ?? ADMIN_METRIC_NA_LABEL}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (account) => (
        <Button
          size="sm"
          className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
          disabled={savingId === account.id}
          onClick={() => void saveObserved(account.id)}
        >
          Сохранить
        </Button>
      ),
    },
  ];

  return (
    <div className={cn("space-y-4 text-sm", !embedded && ADMIN_SECTION_TILE)}>
      {!embedded ? <p className="font-semibold text-zinc-100">{admin.t("admin.treasury.accounts")}</p> : null}
      <p className="text-xs text-zinc-500">{admin.t("admin.treasury.accounts.hint")}</p>
      {message ? <p className="text-xs text-zinc-300">{message}</p> : null}
      <AdminFormField label={admin.t("admin.treasury.accounts.auditReason")} htmlFor="treasury-audit-reason">
        <Input
          id="treasury-audit-reason"
          className={adminFieldInput}
          value={reasonDraft}
          onChange={(e) => setReasonDraft(e.target.value)}
          placeholder={admin.t("admin.treasury.accounts.auditPlaceholder")}
        />
      </AdminFormField>
      <AdminDataTable
        flat
        borderless
        className="[&_table]:min-w-[720px]"
        columns={columns}
        rows={accounts}
        rowKey={(account) => account.id}
        emptyMessage={admin.t("admin.empty.noData")}
      />
    </div>
  );
}

export function AdminTreasuryReconciliationPanel({
  openDiscrepancyCount,
  onRefreshConsole,
}: {
  openDiscrepancyCount: number;
  onRefreshConsole: () => void;
}) {
  const admin = useAdminI18n();
  const client = useAdminApi();
  const [dryRun, setDryRun] = React.useState<ReconciliationDryRun | null>(null);
  const [discrepancies, setDiscrepancies] = React.useState<DiscrepancyRow[]>([]);
  const [running, setRunning] = React.useState(false);
  const [resolveReason, setResolveReason] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);

  const loadDiscrepancies = React.useCallback(() => {
    void client
      .get<DiscrepancyRow[]>(`${ADMIN_API_PATHS.treasury}/reconciliation/discrepancies`)
      .then(setDiscrepancies)
      .catch(() => setDiscrepancies([]));
  }, [client]);

  React.useEffect(() => {
    loadDiscrepancies();
  }, [loadDiscrepancies, openDiscrepancyCount]);

  const run = async (persist: boolean) => {
    setRunning(true);
    setMessage(null);
    try {
      const result = await client.post<ReconciliationDryRun>(
        `${ADMIN_API_PATHS.treasury}/reconciliation/run?dryRun=${persist ? "false" : "true"}`,
      );
      setDryRun(result);
      setMessage(
        persist
          ? admin
              .t("admin.treasury.reconciliation.saved")
              .replace("{count}", String(result.discrepancyCount))
          : admin
              .t("admin.treasury.reconciliation.dryRunResult")
              .replace("{count}", String(result.discrepancyCount)),
      );
      loadDiscrepancies();
      onRefreshConsole();
    } catch (e) {
      setMessage(localizedAdminError(e));
    } finally {
      setRunning(false);
    }
  };

  const resolve = async (id: string) => {
    const reason = resolveReason[id]?.trim();
    if (!reason) {
      setMessage(admin.t("admin.treasury.reconciliation.resolveReason"));
      return;
    }
    try {
      await client.post(`${ADMIN_API_PATHS.treasury}/reconciliation/discrepancies/${id}/resolve`, {
        reason,
      });
      loadDiscrepancies();
      onRefreshConsole();
      setMessage(admin.t("admin.treasury.reconciliation.resolved"));
    } catch (e) {
      setMessage(localizedAdminError(e));
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" className={adminBtnOutline} disabled={running} onClick={() => void run(false)}>
          {admin.t("admin.treasury.reconciliation.dryRun")}
        </Button>
        <Button
          size="sm"
          className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
          disabled={running}
          onClick={() => void run(true)}
        >
          {admin.t("admin.treasury.reconciliation.saveRun")}
        </Button>
      </div>
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
      {dryRun ? (
        <div className={cn(ADMIN_SECTION_NOTICE, "space-y-1 text-xs")}>
          <p className="font-medium text-zinc-200">
            {admin.t("admin.treasury.reconciliation.lastRun").replace("{count}", String(dryRun.discrepancyCount))}
          </p>
          {dryRun.items.slice(0, 5).map((item, i) => (
            <p key={i} className="tabular-nums text-zinc-400">
              {treasuryDiscrepancyTypeLabel(admin, item.type)}: Δ {item.delta} (
              {admin.complianceSeverityLabel(item.severity)})
            </p>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-zinc-500">
        {admin.t("admin.treasury.reconciliation.openCount").replace("{count}", String(openDiscrepancyCount))}
      </p>
      {discrepancies.length > 0 ? (
        <ul className="space-y-2">
          {discrepancies.map((d) => (
            <li key={d.id} className={cn(ADMIN_SECTION_TILE, "text-xs")}>
              <p className="font-medium text-zinc-200">
                {admin.adminTreasuryTypeLabel(d.treasuryAccount.type)} · Δ {d.deltaAmount} ·{" "}
                {admin.complianceSeverityLabel(d.severity)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  className={cn(adminFieldInput, "min-w-[160px] flex-1")}
                  placeholder={admin.t("admin.placeholder.treasuryResolve")}
                  value={resolveReason[d.id] ?? ""}
                  onChange={(e) =>
                    setResolveReason((prev) => ({ ...prev, [d.id]: e.target.value }))
                  }
                />
                <Button size="sm" variant="ghost" className={adminBtnOutline} onClick={() => void resolve(d.id)}>
                  {admin.t("admin.treasury.reconciliation.resolve")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AdminTreasuryLimitsPanel({
  initialLimits,
  embedded = false,
}: {
  initialLimits: OperationalLimits | null;
  embedded?: boolean;
}) {
  const client = useAdminApi();
  const admin = useAdminI18n();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN");
  const [limits, setLimits] = React.useState<OperationalLimits | null>(initialLimits);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLimits(initialLimits);
  }, [initialLimits]);

  const save = async () => {
    if (!limits || !isSuperAdmin) return;
    setSaving(true);
    setMessage(null);
    try {
      const row = await client.patch<OperationalLimits>(`${ADMIN_API_PATHS.treasury}/limits`, limits);
      setLimits(row);
      setMessage(admin.t("admin.treasury.limits.saved"));
    } catch (e) {
      setMessage(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!limits) {
    return (
      <p className="text-sm text-zinc-500">
        {admin.t("admin.treasury.operationalLimits")} {admin.t("admin.empty.noDataHint")}
      </p>
    );
  }

  const fields: Array<{ key: keyof OperationalLimits; label: string }> = [
    { key: "mediumWithdrawalUsdt", label: admin.t("admin.treasury.limit.mediumWithdrawal") },
    { key: "largeWithdrawalUsdt", label: admin.t("admin.treasury.limit.largeWithdrawal") },
    { key: "userDailyWithdrawalUsdt", label: admin.t("admin.treasury.limit.userDailyWithdrawal") },
    { key: "maxAutoCompleteWithdrawalUsdt", label: admin.t("admin.treasury.limit.maxAutoCompleteWithdrawal") },
    { key: "hotWalletMaxDailyOutflowUsdt", label: admin.t("admin.treasury.limit.hotWalletDailyOutflow") },
    { key: "maxAutoCreditDepositUsdt", label: admin.t("admin.treasury.limit.maxAutoCreditDeposit") },
  ];

  return (
    <div className={cn("space-y-4 text-sm", !embedded && ADMIN_SECTION_TILE)}>
      {!embedded ? (
        <p className="font-semibold text-zinc-100">{admin.t("admin.treasury.operationalLimits")}</p>
      ) : null}
      {!isSuperAdmin ? (
        <p className="text-xs text-amber-300">{admin.t("admin.treasury.limits.superAdminOnly")}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <AdminFormField key={f.key} label={f.label} htmlFor={`limit-${f.key}`}>
            <Input
              id={`limit-${f.key}`}
              className={adminFieldInput}
              value={String(limits[f.key])}
              disabled={!isSuperAdmin}
              onChange={(e) =>
                setLimits((prev) =>
                  prev
                    ? {
                        ...prev,
                        [f.key]:
                          f.key === "maxFailedWithdrawalAttempts" || f.key === "reportExportMaxRows"
                            ? Number(e.target.value)
                            : e.target.value,
                      }
                    : prev,
                )
              }
            />
          </AdminFormField>
        ))}
      </div>
      {isSuperAdmin ? (
        <Button
          size="sm"
          className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
          disabled={saving}
          onClick={() => void save()}
        >
          Сохранить лимиты
        </Button>
      ) : null}
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}

export function AdminTreasurySafetyPanel({
  featureFlags,
  onCheckHotWallet,
}: {
  featureFlags: Record<string, boolean>;
  onCheckHotWallet: () => void;
}) {
  const admin = useAdminI18n();
  const activeKillSwitches = Object.entries(KILL_SWITCH_LABELS).filter(
    ([key]) => featureFlags[key] === true,
  );

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-zinc-500">
        {admin.t("admin.treasury.safety.hint")}{" "}
        <Link href={ROUTES.adminOperatorTasks} className="text-[#B7F500] hover:text-[#a8e600]">
          {admin.t("admin.section.operatorTasks")}
        </Link>
      </p>
      {activeKillSwitches.length === 0 ? (
        <div className={cn(ADMIN_SECTION_NOTICE, "text-xs text-emerald-300")}>
          {admin.t("admin.treasury.safety.noActive")}
        </div>
      ) : (
        <ul className="space-y-2">
          {activeKillSwitches.map(([key, label]) => (
            <li key={key} className={cn(ADMIN_SECTION_NOTICE, "text-xs text-rose-200")}>
              {label}
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" variant="ghost" className={adminBtnOutline} onClick={onCheckHotWallet}>
        {admin.t("admin.treasury.safety.checkHot")}
      </Button>
      <p className="text-xs text-zinc-500">
        {admin.t("admin.treasury.safety.approvalsLink")}:{" "}
        <Link href={ROUTES.adminWithdrawals} className="text-[#B7F500] hover:text-[#a8e600]">
          {admin.t("admin.treasury.safety.withdrawalsLink")}
        </Link>
      </p>
    </div>
  );
}
