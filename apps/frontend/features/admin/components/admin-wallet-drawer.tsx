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
import { formatAdminDate, formatUsdtAmount, isAdminMetricEmpty, ADMIN_METRIC_NA_LABEL } from "@/features/admin/lib/admin-format";
import { adminDrawerTab, adminMetricLabel } from "@/features/admin/lib/admin-ui";
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

const drawerPanel = "rounded-2xl bg-zinc-900/40 p-4";
const drawerLink =
  "inline-flex items-center gap-1 text-xs font-medium text-zinc-300 transition-colors hover:text-[#B7F500]";
const drawerListItem = "rounded-2xl bg-zinc-900/40 p-3";

function FieldHint({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-500">
      <HelpCircle className="mt-0.5 size-3 shrink-0 text-zinc-600" />
      {text}
    </p>
  );
}

type MetricTone = "neutral" | "success" | "warning" | "info" | "muted";

function usdtPositive(value: string): boolean {
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return !Number.isNaN(n) && n > 0;
}

function metricValueClass(tone: MetricTone, value: string): string {
  const compact = value.replace(/\s/g, "").length > 14;
  const medium = value.replace(/\s/g, "").length > 10;
  const size = compact ? "text-base leading-snug" : medium ? "text-lg" : "text-xl sm:text-2xl";
  const toneClass: Record<MetricTone, string> = {
    neutral: "text-zinc-100",
    success: "text-emerald-400",
    warning: "text-amber-400",
    info: "text-sky-400",
    muted: "text-zinc-500",
  };
  return cn(
    "mt-1 font-semibold tabular-nums tracking-tight break-words",
    tone === "muted" ? "text-sm font-medium" : size,
    toneClass[tone],
  );
}

function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: MetricTone;
}) {
  const resolvedTone =
    tone === "neutral" && isAdminMetricEmpty(value) ? "muted" : tone;

  return (
    <div className="flex min-h-[7.25rem] min-w-0 flex-col rounded-2xl bg-zinc-900/40 p-3.5">
      <p className={adminMetricLabel}>{label}</p>
      <p className={metricValueClass(resolvedTone, value)} title={value}>
        {value}
      </p>
      {hint ? <FieldHint text={hint} /> : null}
    </div>
  );
}

function userStatusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "suspended" || status === "pending") return "warning";
  if (status === "banned") return "danger";
  return "neutral";
}

function walletStatusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "blocked") return "danger";
  return "neutral";
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
          setLedgerError(e instanceof Error ? e.message : "Не удалось загрузить журнал проводок");
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
      borderless
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

          <div className="flex flex-wrap gap-1 pb-1">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={adminDrawerTab(tab === t.id)}
              >
                {t.label}
                {t.id === "risk" && wallet.hasRiskFlag ? (
                  <ShieldAlert className="ml-1 inline size-3 text-amber-400" />
                ) : null}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Link href={ROUTES.adminUserDetail(wallet.userId)} className={drawerLink}>
                  {a.t("admin.drawer.common.user")} <ExternalLink className="size-3" />
                </Link>
                <Link href={ROUTES.adminWithdrawals} className={drawerLink}>
                  {a.t("admin.drawer.wallet.withdrawals")}
                </Link>
                <Link href={ROUTES.adminDeposits} className={drawerLink}>
                  {a.t("admin.drawer.wallet.deposits")}
                </Link>
                <Link href={ROUTES.adminHoldings} className={drawerLink}>
                  {a.t("admin.drawer.wallet.holdings")}
                </Link>
                <Link href={ROUTES.adminAudit} className={drawerLink}>
                  {a.t("admin.drawer.common.audit")}
                </Link>
              </div>

              <div className={drawerPanel}>
                <p className="font-medium text-zinc-100">{wallet.userDisplayName ?? wallet.userEmail}</p>
                <p className="text-sm text-zinc-500">{wallet.userEmail}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                  {wallet.userId}
                  <AdminCopyButton value={wallet.userId} />
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <AdminStatusBadge
                    label={formatWalletUserStatus(wallet.userStatus)}
                    tone={userStatusTone(wallet.userStatus)}
                  />
                  {wallet.userRoles.map((r) => (
                    <AdminStatusBadge key={r} label={a.adminRoleLabel(r) ?? r} tone="info" />
                  ))}
                  {wallet.hasRiskFlag ? (
                    <AdminStatusBadge label={wallet.riskSeverity ?? "risk"} tone="danger" />
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Баланс</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric
                    label={a.t("admin.drawer.wallet.available")}
                    value={formatUsdtAmount(wallet.availableUsdt)}
                    hint={WALLET_FIELD_TOOLTIPS.available}
                    tone="success"
                  />
                  <Metric
                    label={a.t("admin.drawer.wallet.locked")}
                    value={formatUsdtAmount(wallet.lockedUsdt)}
                    hint={WALLET_FIELD_TOOLTIPS.locked}
                    tone={usdtPositive(wallet.lockedUsdt) ? "warning" : "muted"}
                  />
                  <Metric
                    label={a.t("admin.drawer.wallet.pending")}
                    value={formatUsdtAmount(wallet.pendingUsdt)}
                    hint={WALLET_FIELD_TOOLTIPS.pending}
                    tone={usdtPositive(wallet.pendingUsdt) ? "warning" : "muted"}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">История</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric
                    label={a.t("admin.drawer.wallet.earned")}
                    value={formatUsdtAmount(wallet.earnedTotalUsdt)}
                    hint={WALLET_FIELD_TOOLTIPS.earned}
                    tone={usdtPositive(wallet.earnedTotalUsdt) ? "success" : "muted"}
                  />
                  <Metric
                    label={a.t("admin.drawer.wallet.withdrawn")}
                    value={formatUsdtAmount(wallet.withdrawnTotalUsdt)}
                    hint={WALLET_FIELD_TOOLTIPS.withdrawn}
                    tone={usdtPositive(wallet.withdrawnTotalUsdt) ? "info" : "muted"}
                  />
                  <Metric
                    label={a.t("admin.drawer.wallet.deposited")}
                    value={formatUsdtAmount(wallet.depositsTotalUsdt)}
                    hint={WALLET_FIELD_TOOLTIPS.deposits}
                    tone={usdtPositive(wallet.depositsTotalUsdt) ? "info" : "muted"}
                  />
                </div>
              </div>

              <div className={cn(drawerPanel, "grid gap-3 text-sm sm:grid-cols-2")}>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    {a.t("admin.drawer.wallet.assetNetwork")}
                  </p>
                  <p className="mt-1 font-medium text-zinc-100">
                    {wallet.assetCode} · {wallet.network}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    {a.t("admin.drawer.wallet.walletStatus")}
                  </p>
                  <div className="mt-1">
                    <AdminStatusBadge
                      label={formatWalletStatus(wallet.walletStatus)}
                      tone={walletStatusTone(wallet.walletStatus)}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    {a.t("admin.drawer.wallet.lastActivity")}
                  </p>
                  <p className="mt-1 tabular-nums text-zinc-300">{formatAdminDate(wallet.lastTransactionAt)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    {a.t("admin.drawer.wallet.createdUpdated")}
                  </p>
                  <p className="mt-1 tabular-nums text-zinc-300">
                    {formatAdminDate(wallet.createdAt)} · {formatAdminDate(wallet.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "ledger" ? (
            ledgerLoading ? (
              <AdminLoadingState label={a.t("admin.empty.loading")} />
            ) : ledgerError ? (
              <p className="py-6 text-center text-sm text-red-400">{ledgerError}</p>
            ) : ledgerRows.length ? (
              <>
                <AdminDataTable flat borderless columns={ledgerCols} rows={ledgerRows} rowKey={(r) => r.id} />
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
                  <li key={d.id} className={drawerListItem}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{formatUsdtAmount(d.amountUsdt)}</span>
                      <AdminStatusBadge
                        label={a.formatAdminStatus(d.status)}
                        tone={d.status === "completed" ? "success" : "pending"}
                      />
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
                  <li key={w.id} className={drawerListItem}>
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
                  <li key={m.id} className={cn(drawerListItem, "flex items-center justify-between gap-2")}>
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
                  <li key={f.id} className="rounded-2xl bg-amber-500/10 p-3 text-sm">
                    <ShieldAlert className="mb-2 size-4 text-amber-400" />
                    <div>
                      <p className="font-medium text-zinc-100">{f.flagCode}</p>
                      <p className="mt-1 text-xs text-zinc-400">{f.note ?? ADMIN_METRIC_NA_LABEL}</p>
                      <AdminStatusBadge label={f.severity} tone="warning" />
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
                  <li key={entry.id} className={drawerListItem}>
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
