"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, HelpCircle, ShieldAlert } from "@/lib/lucide";

import {
  AdminDrawerGhostButton,
} from "@/features/admin/components/admin-drawer-buttons";
import type { AdminWalletDetail } from "@/features/admin/mocks/admin-wallets.mock";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import {
  formatMarketKind,
  formatWalletOperation,
  formatWalletStatus,
  formatWalletUserStatus,
  WALLET_FIELD_TOOLTIPS,
} from "@/features/admin/lib/admin-wallet-i18n";
import { formatAdminDate, formatUsdtAmount, ADMIN_METRIC_NA_LABEL } from "@/features/admin/lib/admin-format";
import { AdminDataTable, AdminDetailDrawer, AdminFormFooter, AdminLoadingState, AdminPagination, AdminStatusBadge, type AdminColumn } from "@/features/admin/ui";
import { listAdminWalletTransactions } from "@/services/admin/adminWallets.service";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TabId = "overview" | "ledger" | "deposits" | "withdrawals" | "market" | "risk" | "audit";

type AdminWalletDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: AdminWalletDetail | null;
  loading?: boolean;
  canViewAudit?: boolean;
};

function FieldHint({ text }: { text: string }) {
  return (
    <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-relaxed text-zinc-500">
      <HelpCircle className="mt-0.5 size-3 shrink-0" />
      {text}
    </p>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">{value}</p>
      {hint ? <FieldHint text={hint} /> : null}
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-zinc-500">{message}</p>;
}

export function AdminWalletDrawer({
  open,
  onOpenChange,
  wallet,
  loading,
  canViewAudit = true,
}: AdminWalletDrawerProps) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [tab, setTab] = React.useState<TabId>("overview");
  const [ledgerPage, setLedgerPage] = React.useState(1);
  const [ledgerRows, setLedgerRows] = React.useState<NonNullable<AdminWalletDetail["ledger"]>>([]);
  const [ledgerTotal, setLedgerTotal] = React.useState(0);
  const [ledgerLoading, setLedgerLoading] = React.useState(false);
  const [ledgerError, setLedgerError] = React.useState<string | null>(null);
  const ledgerPageSize = 20;

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "ledger", label: a.t("admin.drawer.common.ledger") },
    { id: "deposits", label: a.t("admin.drawer.wallet.deposits") },
    { id: "withdrawals", label: a.t("admin.drawer.wallet.withdrawals") },
    { id: "market", label: a.t("admin.drawer.wallet.market") },
    { id: "risk", label: a.t("admin.drawer.wallet.risk") },
    { id: "audit", label: a.t("admin.drawer.common.audit") },
  ];

  React.useEffect(() => {
    if (open) {
      setTab("overview");
      setLedgerPage(1);
    }
  }, [open, wallet?.id]);

  React.useEffect(() => {
    if (!open || tab !== "ledger" || !wallet?.id) return;
    let cancelled = false;
    setLedgerLoading(true);
    setLedgerError(null);
    void listAdminWalletTransactions(wallet.id, { page: ledgerPage, pageSize: ledgerPageSize }, client)
      .then((res) => {
        if (cancelled) return;
        setLedgerRows((res.items ?? []) as NonNullable<AdminWalletDetail["ledger"]>);
        setLedgerTotal(res.total ?? 0);
      })
      .catch((e) => {
        if (!cancelled) {
          setLedgerError(e instanceof Error ? e.message : "Не удалось загрузить ledger");
          setLedgerRows([]);
          setLedgerTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLedgerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, wallet?.id, ledgerPage, client]);

  const visibleTabs = tabs.filter((t) => (t.id === "audit" ? canViewAudit : true));

  const ledgerCols: AdminColumn<NonNullable<AdminWalletDetail["ledger"]>[number]>[] = [
    {
      key: "at",
      header: a.t("admin.drawer.common.date"),
      render: (r) => formatAdminDate(r.createdAt),
    },
    {
      key: "op",
      header: a.t("admin.drawer.common.operation"),
      render: (r) => formatWalletOperation(r.operationType),
    },
    {
      key: "dir",
      header: a.t("admin.drawer.common.direction"),
      render: (r) => r.direction,
    },
    {
      key: "amt",
      header: a.t("admin.drawer.common.amount"),
      render: (r) => formatUsdtAmount(r.amountUsdt),
    },
    {
      key: "fee",
      header: a.t("admin.drawer.common.fee"),
      render: (r) => formatUsdtAmount(r.feeUsdt),
    },
    {
      key: "status",
      header: a.t("admin.drawer.common.status"),
      render: (r) => (
        <AdminStatusBadge
          label={a.formatAdminStatus(r.status)}
          tone={r.status === "completed" ? "success" : "pending"}
        />
      ),
    },
    {
      key: "ref",
      header: a.t("admin.drawer.common.reference"),
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-[10px]">
          {r.referenceId.slice(0, 8)}…
          <AdminCopyButton value={r.referenceId} />
        </span>
      ),
    },
  ];

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      wide
      widthClassName="w-[min(960px,100vw)]"
      title={wallet ? wallet.userEmail : a.t("admin.drawer.wallet.title")}
      subtitle={wallet ? `${wallet.assetCode} · ${wallet.network}` : undefined}
      footer={
        <AdminFormFooter
          right={
            <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>
              {a.t("admin.drawer.common.close")}
            </AdminDrawerGhostButton>
          }
        />
      }
    >
      {loading ? <AdminLoadingState label={a.t("admin.drawer.wallet.loading")} /> : null}

      {wallet && !loading ? (
        <div className="space-y-5 pb-4">
          <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
            {a.t("admin.drawer.wallet.walletId").replace("{id}", wallet.id)}
            <AdminCopyButton value={wallet.id} />
          </p>

          <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-1">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={ROUTES.adminUserDetail(wallet.userId)}
                  className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:underline"
                >
                  {a.t("admin.drawer.common.user")} <ExternalLink className="size-3.5" />
                </Link>
                <Link href={ROUTES.adminWithdrawals} className="text-sm text-zinc-400 hover:underline">
                  {a.t("admin.drawer.wallet.withdrawals")}
                </Link>
                <Link href={ROUTES.adminDeposits} className="text-sm text-zinc-400 hover:underline">
                  {a.t("admin.drawer.wallet.deposits")}
                </Link>
                <Link href={ROUTES.adminHoldings} className="text-sm text-zinc-400 hover:underline">
                  {a.t("admin.drawer.wallet.holdings")}
                </Link>
                <Link href={ROUTES.adminAudit} className="text-sm text-zinc-400 hover:underline">
                  {a.t("admin.drawer.common.audit")}
                </Link>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-50/50 p-4">
                <p className="font-medium text-zinc-100">{wallet.userDisplayName ?? wallet.userEmail}</p>
                <p className="text-sm text-zinc-500">{wallet.userEmail}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                  {wallet.userId}
                  <AdminCopyButton value={wallet.userId} />
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <AdminStatusBadge label={formatWalletUserStatus(wallet.userStatus)} tone="neutral" />
                  {wallet.userRoles.map((r) => (
                    <AdminStatusBadge key={r} label={a.adminRoleLabel(r) ?? r} tone="neutral" />
                  ))}
                  {wallet.hasRiskFlag ? (
                    <AdminStatusBadge label={wallet.riskSeverity ?? "risk"} tone="danger" />
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Metric
                  label={a.t("admin.drawer.wallet.available")}
                  value={formatUsdtAmount(wallet.availableUsdt)}
                  hint={WALLET_FIELD_TOOLTIPS.available}
                />
                <Metric
                  label={a.t("admin.drawer.wallet.locked")}
                  value={formatUsdtAmount(wallet.lockedUsdt)}
                  hint={WALLET_FIELD_TOOLTIPS.locked}
                />
                <Metric
                  label={a.t("admin.drawer.wallet.pending")}
                  value={formatUsdtAmount(wallet.pendingUsdt)}
                  hint={WALLET_FIELD_TOOLTIPS.pending}
                />
                <Metric
                  label={a.t("admin.drawer.wallet.earned")}
                  value={formatUsdtAmount(wallet.earnedTotalUsdt)}
                  hint={WALLET_FIELD_TOOLTIPS.earned}
                />
                <Metric
                  label={a.t("admin.drawer.wallet.withdrawn")}
                  value={formatUsdtAmount(wallet.withdrawnTotalUsdt)}
                  hint={WALLET_FIELD_TOOLTIPS.withdrawn}
                />
                <Metric
                  label={a.t("admin.drawer.wallet.deposited")}
                  value={formatUsdtAmount(wallet.depositsTotalUsdt)}
                  hint={WALLET_FIELD_TOOLTIPS.deposits}
                />
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.wallet.assetNetwork")}</dt>
                  <dd>
                    {wallet.assetCode} · {wallet.network}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.wallet.walletStatus")}</dt>
                  <dd>{formatWalletStatus(wallet.walletStatus)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.wallet.lastActivity")}</dt>
                  <dd>{formatAdminDate(wallet.lastTransactionAt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.wallet.createdUpdated")}</dt>
                  <dd>
                    {formatAdminDate(wallet.createdAt)} · {formatAdminDate(wallet.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {tab === "ledger" ? (
            ledgerLoading ? (
              <AdminLoadingState label={a.t("admin.empty.loading")} />
            ) : ledgerError ? (
              <p className="py-6 text-center text-sm text-red-400">{ledgerError}</p>
            ) : ledgerRows.length ? (
              <>
                <AdminDataTable flat columns={ledgerCols} rows={ledgerRows} rowKey={(r) => r.id} />
                <AdminPagination
                  page={ledgerPage}
                  pageSize={ledgerPageSize}
                  total={ledgerTotal}
                  onPageChange={setLedgerPage}
                />
              </>
            ) : (
              <EmptyTab message={a.t("admin.drawer.wallet.emptyLedger")} />
            )
          ) : null}

          {tab === "deposits" ? (
            wallet.deposits?.length ? (
              <ul className="space-y-2 text-sm">
                {wallet.deposits.map((d) => (
                  <li key={d.id} className="rounded-xl border border-zinc-800 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{formatUsdtAmount(d.amountUsdt)}</span>
                      <AdminStatusBadge label={a.formatAdminStatus(d.status)} tone="pending" />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {d.network} · {formatAdminDate(d.createdAt)}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                      {d.txHash}
                      <AdminCopyButton value={d.txHash} />
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyTab message={a.t("admin.drawer.wallet.emptyDeposits")} />
            )
          ) : null}

          {tab === "withdrawals" ? (
            wallet.withdrawals?.length ? (
              <ul className="space-y-2 text-sm">
                {wallet.withdrawals.map((w) => (
                  <li key={w.id} className="rounded-xl border border-zinc-800 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {formatUsdtAmount(w.netAmountUsdt)} {a.t("admin.drawer.wallet.netShort")}
                      </span>
                      <AdminStatusBadge label={a.formatAdminStatus(w.status)} tone="warning" />
                    </div>
                    <p className="text-xs text-zinc-500">
                      {a
                        .t("admin.drawer.wallet.grossFee")
                        .replace("{gross}", formatUsdtAmount(w.amountGrossUsdt))
                        .replace("{fee}", formatUsdtAmount(w.feeUsdt))}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-zinc-400">{w.address}</p>
                    <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px]">
                      {w.id}
                      <AdminCopyButton value={w.id} />
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyTab message={a.t("admin.drawer.wallet.emptyWithdrawals")} />
            )
          ) : null}

          {tab === "market" ? (
            wallet.market?.length ? (
              <ul className="space-y-2 text-sm">
                {wallet.market.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 p-3">
                    <div>
                      <p className="font-medium">{formatMarketKind(m.kind)}</p>
                      <p className="text-xs text-zinc-500">{m.releaseTitle ?? ADMIN_METRIC_NA_LABEL}</p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p>{formatUsdtAmount(m.amountUsdt)}</p>
                      <p className="text-xs text-zinc-500">{formatAdminDate(m.happenedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyTab message={a.t("admin.drawer.wallet.emptyMarket")} />
            )
          ) : null}

          {tab === "risk" ? (
            wallet.risk?.length ? (
              <ul className="space-y-2">
                {wallet.risk.map((f) => (
                  <li key={f.id} className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-medium">{f.flagCode}</p>
                      <p className="text-xs text-zinc-400">{f.note ?? ADMIN_METRIC_NA_LABEL}</p>
                      <AdminStatusBadge label={f.severity} tone="danger" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyTab message={a.t("admin.drawer.wallet.emptyRisk")} />
            )
          ) : null}

          {tab === "audit" && canViewAudit ? (
            wallet.audit?.length ? (
              <ul className="space-y-2 text-sm">
                {wallet.audit.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-zinc-800 p-3">
                    <p className="font-medium">{a.formatAuditAction(entry.action)}</p>
                    <p className="text-xs text-zinc-500">
                      {entry.actorEmail ?? "system"} · {formatAdminDate(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyTab message={a.t("admin.drawer.wallet.emptyAudit")} />
            )
          ) : null}
        </div>
      ) : null}
    </AdminDetailDrawer>
  );
}
