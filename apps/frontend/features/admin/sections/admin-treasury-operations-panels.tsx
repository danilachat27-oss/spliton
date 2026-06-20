"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAuth } from "@/components/providers/auth-provider";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ROUTES } from "@/constants/routes";

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

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-zinc-100">{children}</p>;
}

export function AdminTreasuryAccountsPanel() {
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
        for (const a of rows) draft[a.id] = a.balanceObserved ?? a.balanceExpected;
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
      setMessage("Укажите причину для audit log");
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

  if (loading) return <p className="text-sm text-zinc-500">Загрузка счетов treasury…</p>;

  return (
    <div className="space-y-3 text-sm">
      <PanelTitle>{admin.t("admin.treasury.accounts")}</PanelTitle>
      <p className="text-xs text-zinc-500">Private keys не хранятся. Observed balance — ручной ввод или provider.</p>
      {message ? <p className="text-xs text-zinc-300">{message}</p> : null}
      <label className="block text-xs">
        <span className="text-zinc-400">Причина изменения (audit)</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5"
          value={reasonDraft}
          onChange={(e) => setReasonDraft(e.target.value)}
          placeholder="Reconciliation / provider check…"
        />
      </label>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-400">
            <tr>
              <th className="px-3 py-2">{admin.t("admin.table.type")}</th>
              <th className="px-3 py-2">{admin.t("admin.table.expected")}</th>
              <th className="px-3 py-2">{admin.t("admin.table.observed")}</th>
              <th className="px-3 py-2">{admin.table.address}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-t border-zinc-800">
                <td className="px-3 py-2 font-medium">{admin.adminTreasuryTypeLabel(account.type)}</td>
                <td className="px-3 py-2 tabular-nums">{account.balanceExpected}</td>
                <td className="px-3 py-2">
                  <input
                    className="w-28 rounded border border-zinc-800 px-1.5 py-1 tabular-nums"
                    value={observedDraft[account.id] ?? ""}
                    onChange={(e) =>
                      setObservedDraft((prev) => ({ ...prev, [account.id]: e.target.value }))
                    }
                  />
                </td>
                <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]">
                  {account.address ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <Button
                    size="sm"
                    variant="ghost" className={adminBtnOutline}
                    disabled={savingId === account.id}
                    onClick={() => void saveObserved(account.id)}
                  >
                    Сохранить
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function treasuryDiscrepancyTypeLabel(
  admin: ReturnType<typeof useAdminI18n>,
  type: string,
): string {
  return admin.adminTreasuryTypeLabel(type) || admin.ledgerOperationLabel(type);
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
          ? `Reconciliation сохранён: ${result.discrepancyCount} расхождений`
          : `Dry-run: ${result.discrepancyCount} расхождений`,
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
      setMessage("Укажите причину resolve");
      return;
    }
    try {
      await client.post(`${ADMIN_API_PATHS.treasury}/reconciliation/discrepancies/${id}/resolve`, {
        reason,
      });
      loadDiscrepancies();
      onRefreshConsole();
      setMessage("Расхождение закрыто");
    } catch (e) {
      setMessage(localizedAdminError(e));
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <PanelTitle>Reconciliation</PanelTitle>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" className={adminBtnOutline} disabled={running} onClick={() => void run(false)}>
          Dry-run
        </Button>
        <Button size="sm" disabled={running} onClick={() => void run(true)}>
          Сохранить run
        </Button>
      </div>
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
      {dryRun ? (
        <div className="rounded-lg bg-zinc-50 p-3 text-xs">
          <p className="font-medium">Последний run: {dryRun.discrepancyCount} items</p>
          {dryRun.items.slice(0, 5).map((item, i) => (
            <p key={i} className="mt-1 tabular-nums text-zinc-300">
              {treasuryDiscrepancyTypeLabel(admin, item.type)}: Δ {item.delta} ({admin.complianceSeverityLabel(item.severity)})
            </p>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-zinc-500">Открытые расхождения: {openDiscrepancyCount}</p>
      {discrepancies.length > 0 ? (
        <ul className="space-y-2">
          {discrepancies.map((d) => (
            <li key={d.id} className="rounded-lg border border-zinc-800 p-3 text-xs">
              <p className="font-medium">
                {d.treasuryAccount.type} · Δ {d.deltaAmount} · {d.severity}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  className="min-w-[160px] flex-1 rounded border border-zinc-800 px-2 py-1"
                  placeholder={admin.t("admin.placeholder.treasuryResolve")}
                  value={resolveReason[d.id] ?? ""}
                  onChange={(e) =>
                    setResolveReason((prev) => ({ ...prev, [d.id]: e.target.value }))
                  }
                />
                <Button size="sm" variant="ghost" className={adminBtnOutline} onClick={() => void resolve(d.id)}>
                  Resolve
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AdminTreasuryLimitsPanel({ initialLimits }: { initialLimits: OperationalLimits | null }) {
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
      setMessage("Лимиты обновлены (audit)");
    } catch (e) {
      setMessage(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!limits) {
    return <p className="text-sm text-zinc-500">{admin.t("admin.treasury.operationalLimits")} недоступны.</p>;
  }

  const fields: Array<{ key: keyof OperationalLimits; label: string; step?: string }> = [
    { key: "mediumWithdrawalUsdt", label: admin.t("admin.treasury.limit.mediumWithdrawal") },
    { key: "largeWithdrawalUsdt", label: admin.t("admin.treasury.limit.largeWithdrawal") },
    { key: "userDailyWithdrawalUsdt", label: admin.t("admin.treasury.limit.userDailyWithdrawal") },
    { key: "maxAutoCompleteWithdrawalUsdt", label: admin.t("admin.treasury.limit.maxAutoCompleteWithdrawal") },
    { key: "hotWalletMaxDailyOutflowUsdt", label: admin.t("admin.treasury.limit.hotWalletDailyOutflow") },
    { key: "maxAutoCreditDepositUsdt", label: admin.t("admin.treasury.limit.maxAutoCreditDeposit") },
  ];

  return (
    <div className="space-y-3 text-sm">
      <PanelTitle>{admin.t("admin.treasury.operationalLimits")}</PanelTitle>
      {!isSuperAdmin ? (
        <p className="text-xs text-amber-800">Редактирование — только SUPER_ADMIN. Просмотр доступен finance roles.</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block text-xs">
            <span className="text-zinc-400">{f.label}</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 tabular-nums"
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
          </label>
        ))}
      </div>
      {isSuperAdmin ? (
        <Button size="sm" disabled={saving} onClick={() => void save()}>
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
  const activeKillSwitches = Object.entries(KILL_SWITCH_LABELS).filter(
    ([key]) => featureFlags[key] === true,
  );

  return (
    <div className="space-y-3 text-sm">
      <PanelTitle>Emergency pause / kill switches</PanelTitle>
      <p className="text-xs text-zinc-500">
        Управление через env (<code className="font-mono">KILL_SWITCH_*</code>). Изменения audit через safety
        console API.{" "}
        <Link href={ROUTES.adminOperatorTasks} className="underline">
          Operator tasks
        </Link>
      </p>
      {activeKillSwitches.length === 0 ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">Активных kill switches нет.</p>
      ) : (
        <ul className="space-y-1">
          {activeKillSwitches.map(([key, label]) => (
            <li key={key} className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-950">
              {label}
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" variant="ghost" className={adminBtnOutline} onClick={onCheckHotWallet}>
        Проверить hot wallet thresholds
      </Button>
      <p className="text-xs text-zinc-500">
        Очередь approvals:{" "}
        <Link href={ROUTES.adminWithdrawals} className="underline">
          Withdrawals admin
        </Link>
      </p>
    </div>
  );
}
