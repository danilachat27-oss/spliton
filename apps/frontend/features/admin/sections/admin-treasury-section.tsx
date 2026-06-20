"use client";



import * as React from "react";

import Link from "next/link";



import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";

import {

  AdminSectionDataArea,

  AdminSectionPanel,

  AdminSectionShell,

} from "@/features/admin/components/admin-section-layout";

import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";

import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { AdminDepositNetworkSettingsPanel } from "@/features/admin/sections/admin-deposit-network-settings-panel";
import { AdminDepositAddressPoolPanel } from "@/features/admin/sections/admin-deposit-address-pool-panel";

import {

  AdminTreasuryAccountsPanel,

  AdminTreasuryLimitsPanel,

  AdminTreasuryReconciliationPanel,

  AdminTreasurySafetyPanel,

} from "@/features/admin/sections/admin-treasury-operations-panels";

import { ROUTES } from "@/constants/routes";



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



export function AdminTreasurySection() {

  const a = useAdminI18n();
  const client = useAdminApi();

  const [data, setData] = React.useState<TreasuryConsole | null>(null);

  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState(false);

  const [hotCheckMessage, setHotCheckMessage] = React.useState<string | null>(null);



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

      .then((r) => setHotCheckMessage(`Проверка выполнена. Alerts: ${r.alertsCreated ?? 0}`))

      .catch((e) => setHotCheckMessage(localizedAdminError(e)));

  };



  return (

    <AdminSectionShell

      sectionId="treasury"

      title={a.t("admin.treasury.title")}

      banner={

        <p className="text-sm text-zinc-400">

          Hot/cold wallet, approvals, reconciliation и kill switches (без private keys).

        </p>

      }

      actions={

        <Button type="button" variant="ghost" className={adminBtnOutline} size="sm" onClick={load}>

          Обновить

        </Button>

      }

    >

      <AdminSectionPanel>

        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">

          Real-money rehearsal: dry-run reconciliation и mock TRON provider. Hot/cold — публичные адреса через env (

          <code className="font-mono">TREASURY_HOT_WALLET_ADDRESS</code>). Private keys не хранятся в приложении.

        </p>

        <AdminSectionDataArea loading={loading} error={error} onRetry={load}>

          {data ? (

            <div className="space-y-4">

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <div className="rounded-xl border border-zinc-800 p-4 text-sm">

                  <p className="font-semibold text-zinc-100">{a.t("admin.treasury.hotWallet")}</p>

                  <p className="mt-1 break-all font-mono text-[10px] text-zinc-400">

                    {data.hotWallet?.configured

                      ? data.hotWallet.address

                      : "Не настроен (SEED_TREASURY_ACCOUNTS_ON_BOOT)"}

                  </p>

                  <p className="mt-2 tabular-nums text-zinc-200">

                    {a.t("admin.table.expected")}: {data.hotWallet?.balanceExpected ?? "—"} · {a.t("admin.table.observed")}:{" "}

                    {data.hotWallet?.balanceObserved ?? "—"}

                  </p>

                  {data.hotWallet?.minThreshold ? (

                    <p className="mt-1 text-xs text-zinc-500">

                      Min: {data.hotWallet.minThreshold} · Max: {data.hotWallet.maxThreshold ?? "—"}

                    </p>

                  ) : null}

                </div>

                <div className="rounded-xl border border-zinc-800 p-4 text-sm">

                  <p className="font-semibold text-zinc-100">{a.t("admin.treasury.coldWallet")}</p>

                  <p className="mt-1 break-all font-mono text-[10px] text-zinc-400">

                    {data.coldWallet?.configured ? data.coldWallet.address : "Не настроен"}

                  </p>

                  <p className="mt-2 text-xs text-zinc-500">{data.coldWallet?.note ?? "Manual/external only"}</p>

                </div>

                <div className="rounded-xl border border-zinc-800 p-4 text-sm">

                  <p className="font-semibold text-zinc-100">Очереди</p>

                  <ul className="mt-2 space-y-1 text-zinc-300">

                    <li>

                      Pending withdrawals:{" "}

                      <Link href={ROUTES.adminWithdrawals} className="underline">

                        {data.pendingWithdrawals}

                      </Link>

                    </li>

                    <li>Approval queue: {data.approvalQueue}</li>

                    <li>Daily outflow USDT: {data.dailyOutflowUsdt}</li>

                    <li>Open discrepancies: {data.openDiscrepancyCount}</li>

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

            </div>

          ) : null}

        </AdminSectionDataArea>

      </AdminSectionPanel>



      <AdminSectionPanel>

        <AdminTreasurySafetyPanel

          featureFlags={data?.featureFlags ?? {}}

          onCheckHotWallet={checkHotWallet}

        />

      </AdminSectionPanel>



      <AdminSectionPanel>

        <AdminTreasuryReconciliationPanel

          openDiscrepancyCount={data?.openDiscrepancyCount ?? 0}

          onRefreshConsole={load}

        />

      </AdminSectionPanel>



      <AdminSectionPanel>

        <AdminTreasuryAccountsPanel />

      </AdminSectionPanel>



      <AdminSectionPanel>

        <AdminTreasuryLimitsPanel

          initialLimits={data?.limits as Parameters<typeof AdminTreasuryLimitsPanel>[0]["initialLimits"]}

        />

      </AdminSectionPanel>



      <AdminSectionPanel>

        <AdminDepositNetworkSettingsPanel />

      </AdminSectionPanel>



      <AdminSectionPanel>

        <AdminDepositAddressPoolPanel />

      </AdminSectionPanel>

    </AdminSectionShell>

  );

}

