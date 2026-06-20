"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3 } from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminDepositDrawer,
  type DepositPendingAction,
} from "@/features/admin/components/admin-deposit-drawer";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import {
  depositStatusLabel,
  depositStatusTone,
  formatConfirmations,
  isReadyToCredit,
  tronTxExplorerUrl,
} from "@/features/admin/lib/admin-deposit-i18n";
import {
  ADMIN_METRIC_NA_LABEL,
  formatAdminDate,
  formatAdminMetricMinutes,
  formatUsdtAmount,
  isAdminMetricEmpty,
} from "@/features/admin/lib/admin-format";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AdminDepositDetail, AdminDepositListItem } from "@/features/admin/mocks/admin-deposits.mock";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import {
  getAdminDeposit,
  getAdminDepositsSummary,
  listAdminDepositsPaginated,
  patchAdminDepositStatus,
  reconcileAdminDeposit,
  reviewAdminDeposit,
  type AdminDepositsQuery,
} from "@/services/admin/adminDeposits.service";
import { cn } from "@/lib/utils";

const DEPOSIT_FILTER_OPTIONS_BASE = [
  { value: "all", label: "Все пополнения" },
  { value: "manual_review", label: "Ручная проверка" },
  { value: "high_value", labelKey: "admin.filter.highValue" as const },
  { value: "failed", label: "Ошибочные" },
  { value: "no_tx_hash", label: "Без хеша транзакции" },
  { value: "with_risk", labelKey: "admin.filter.riskFlags" as const },
];

const STATUS_OPTIONS_BASE = [
  { value: "pending", label: depositStatusLabel("pending") },
  { value: "confirming", label: depositStatusLabel("confirming") },
  { value: "manual_review", label: depositStatusLabel("manual_review") },
  { value: "completed", label: depositStatusLabel("completed") },
  { value: "failed", label: depositStatusLabel("failed") },
  { value: "rejected", label: depositStatusLabel("rejected") },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "amount", label: "Крупнее сумма" },
  { value: "confirmations", label: "Больше подтверждений" },
];

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "info" | "danger";
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "info"
          ? "text-sky-400"
          : tone === "danger"
            ? "text-red-400"
            : "text-zinc-100";
  const empty = isAdminMetricEmpty(value);
  return (
    <div className={cn(ADMIN_SECTION_TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
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
}

export function DepositsSection() {
  const a = useAdminI18n();
  const statusOptions = React.useMemo(
    () => [{ value: "all", label: a.actions.allStatuses }, ...STATUS_OPTIONS_BASE],
    [a],
  );
  const depositFilterOptions = React.useMemo(
    () =>
      DEPOSIT_FILTER_OPTIONS_BASE.map((opt) =>
        "labelKey" in opt && opt.labelKey
          ? { value: opt.value, label: a.t(opt.labelKey) }
          : { value: opt.value, label: opt.label },
      ),
    [a],
  );
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const readOnly = perms.readOnly("Deposits");
  const canMutate = perms.can("Deposits", "approve") || perms.can("Deposits", "update");

  const loader = React.useCallback(
    (q: AdminDepositsQuery) => listAdminDepositsPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);

  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getAdminDepositsSummary>> | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [depositFilter, setDepositFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [minAmount, setMinAmount] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AdminDepositDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const summaryQuery = React.useMemo(
    () => ({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    [dateFrom, dateTo],
  );

  const loadSummary = React.useCallback(async () => {
    setSummaryLoading(true);
    try {
      setSummary(await getAdminDepositsSummary(client, summaryQuery));
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [client, summaryQuery]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      depositFilter: depositFilter === "all" ? undefined : depositFilter,
      sortBy: sortBy === "newest" ? undefined : sortBy,
      sortDir: sortBy === "oldest" ? "asc" : "desc",
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minAmount: minAmount || undefined,
      asset: "USDT",
      network: "TRC20",
    }));
  }, [search, statusFilter, depositFilter, sortBy, dateFrom, dateTo, minAmount, setQuery]);

  async function openDetail(row: AdminDepositListItem) {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetail({
      ...row,
      fromAddress: null,
      receivedAt: row.completedAt,
    });
    try {
      const loaded = await getAdminDeposit(row.id, client);
      if (loaded) setDetail(loaded);
    } catch {
      /* keep list preview */
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAction(action: DepositPendingAction, note: string) {
    if (!detail) return;
    const id = detail.id;
    setActionError(null);
    try {
      if (action.action === "reconcile") {
        await reconcileAdminDeposit(id, note || undefined, client);
      } else if (action.action === "manual_review") {
        await reviewAdminDeposit(id, note || undefined, client);
      } else {
        await patchAdminDepositStatus(id, action.action, note || undefined, client);
      }
      const refreshed = await getAdminDeposit(id, client);
      if (refreshed) setDetail(refreshed);
      await reload();
      void loadSummary();
    } catch (e) {
      setActionError(localizedAdminError(e));
      throw e;
    }
  }

  const columns: AdminColumn<AdminDepositListItem>[] = [
    {
      key: "id",
      header: a.table.id,
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-[10px]">
          {r.id.slice(0, 10)}…
          <AdminCopyButton value={r.id} />
        </span>
      ),
    },
    {
      key: "user",
      header: a.table.user,
      render: (r) => (
        <div className="min-w-[160px]">
          <Link
            href={ROUTES.adminUserDetail(r.userId)}
            className="text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {r.userEmail}
          </Link>
          <p className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400">
            {r.userId.slice(0, 8)}…
            <AdminCopyButton value={r.userId} />
          </p>
        </div>
      ),
    },
    {
      key: "wallet",
      header: a.t("admin.table.wallet"),
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
          {r.walletId.slice(0, 8)}…
          <AdminCopyButton value={r.walletId} />
        </span>
      ),
    },
    {
      key: "amount",
      header: a.table.amount,
      render: (r) => (
        <span className={cn("tabular-nums font-medium", r.isHighValue && "text-amber-800")}>
          {formatUsdtAmount(r.amountUsdt)}
        </span>
      ),
    },
    {
      key: "asset",
      header: a.table.asset,
      render: (r) => `${r.asset} · ${r.network}`,
    },
    {
      key: "addr",
      header: a.table.address,
      render: (r) => (
        <span className="inline-flex max-w-[100px] items-center gap-1 truncate font-mono text-[10px]">
          {r.depositAddress.slice(0, 8)}…
          <AdminCopyButton value={r.depositAddress} />
        </span>
      ),
    },
    {
      key: "tx",
      header: a.table.txHash,
      render: (r) => {
        const url = tronTxExplorerUrl(r.txHash);
        if (!r.hasTxHash || !r.txHash) {
          return <AdminStatusBadge label={a.t("admin.drawer.withdrawal.noTxHash")} tone="warning" />;
        }
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px]">
            {r.txHash.slice(0, 8)}…
            <AdminCopyButton value={r.txHash} />
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className="text-sky-700" onClick={(e) => e.stopPropagation()}>
                ↗
              </a>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "conf",
      header: a.table.confirmations,
      render: (r) => (
        <div className="text-xs">
          <p className="tabular-nums">{formatConfirmations(r.confirmations, r.requiredConfirmations)}</p>
          {isReadyToCredit(r.confirmations, r.requiredConfirmations, r.status) ? (
            <AdminStatusBadge label={a.t("admin.ui.ready")} tone="success" />
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <div className="flex flex-col gap-1">
          <AdminStatusBadge label={depositStatusLabel(r.status)} tone={depositStatusTone(r.status)} />
          {r.hasRiskFlag ? <AdminStatusBadge label={r.riskSeverity ?? "risk"} tone="danger" /> : null}
        </div>
      ),
    },
    {
      key: "created",
      header: a.table.created,
      render: (r) => (
        <span className="whitespace-nowrap text-xs tabular-nums">{formatAdminDate(r.createdAt)}</span>
      ),
    },
    {
      key: "updated",
      header: "Обновлено",
      render: (r) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-zinc-500">{formatAdminDate(r.updatedAt)}</span>
      ),
    },
    {
      key: "open",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm font-medium hover:bg-zinc-800/60"
          onClick={(e) => {
            e.stopPropagation();
            void openDetail(r);
          }}
        >
          {a.actions.detail}
        </button>
      ),
    },
  ];

  return (
    <AdminSectionShell
      sectionId="deposits"
      title={a.adminSectionLabel("deposits")}
      infoHint={
        <>
          Контроль входящих USDT TRC20 платежей Spliton: подтверждения сети, ручная сверка и зачисления на кошельки
          пользователей через wallet ledger.
        </>
      }
      actions={
        <AdminSectionRefreshButton
          onClick={() => {
            reload();
            void loadSummary();
          }}
        />
      }
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("deposits")} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatTile
          label={a.t("admin.kpi.deposits.totalDeposited")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalDepositedUsdt ?? "0")}
          tone="success"
        />
        <StatTile label={a.t("admin.kpi.pending")} value={summaryLoading ? "…" : String(summary?.pendingCount ?? 0)} tone="info" />
        <StatTile
          label={a.t("admin.kpi.manualReview")}
          value={summaryLoading ? "…" : String(summary?.manualReviewCount ?? 0)}
          tone="warning"
        />
        <StatTile
          label={a.t("admin.kpi.completed")}
          value={summaryLoading ? "…" : String(summary?.completedCount ?? 0)}
          tone="success"
        />
        <StatTile label={a.t("admin.kpi.errors")} value={summaryLoading ? "…" : String(summary?.failedCount ?? 0)} tone="danger" />
        <StatTile
          label={a.t("admin.kpi.deposits.avgConfirmation")}
          value={
            summaryLoading
              ? "…"
              : formatAdminMetricMinutes(summary?.avgConfirmationMinutes ?? null)
          }
        />
        <StatTile label={a.t("admin.filter.highValue")} value={summaryLoading ? "…" : String(summary?.highValueCount ?? 0)} tone="warning" />
        <StatTile label={a.t("admin.filter.riskFlags")} value={summaryLoading ? "…" : String(summary?.depositsWithRiskFlags ?? 0)} tone="warning" />
      </div>

      <div className={cn(ADMIN_SECTION_TILE, "space-y-2")}>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Аналитика</p>
        <Link href={ROUTES.adminAnalyticsFinance} className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:underline">
          <BarChart3 className="size-3.5" /> Финансовая аналитика
        </Link>
      </div>

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          fields={[
            {
              id: "search",
              label: "Поиск",
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: "Email, tx hash, address, id…",
            },
            {
              id: "status",
              label: a.table.status,
              type: "select",
              value: statusFilter,
              onChange: setStatusFilter,
              options: statusOptions,
            },
            {
              id: "filter",
              label: "Фильтр",
              type: "select",
              value: depositFilter,
              onChange: setDepositFilter,
              options: depositFilterOptions,
            },
            {
              id: "sort",
              label: "Сортировка",
              type: "select",
              value: sortBy,
              onChange: setSortBy,
              options: SORT_OPTIONS,
            },
            {
              id: "from",
              label: "Дата с",
              type: "date",
              value: dateFrom,
              onChange: setDateFrom,
            },
            {
              id: "to",
              label: "Дата по",
              type: "date",
              value: dateTo,
              onChange: setDateTo,
            },
            {
              id: "minAmount",
              label: a.t("admin.filters.minAmount"),
              type: "search",
              value: minAmount,
              onChange: setMinAmount,
              placeholder: "0",
            },
          ]}
        />

        <AdminSectionDataArea loading={loading} error={error} onRetry={reload} loadingLabel="Загрузка пополнений…">
          <AdminDataTable
            flat
            columns={columns}
            rows={page.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => void openDetail(r)}
            emptyMessage={
              !loading && !error && page.items.length === 0
                ? "Пополнений пока нет."
                : a.empty.noData
            }
          />
          <AdminPagination
            page={query.page ?? 1}
            pageSize={query.pageSize ?? 20}
            total={page.total}
            onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      {actionError ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-300" role="alert">
          {actionError}
        </p>
      ) : null}

      <AdminDepositDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        deposit={detail}
        loading={detailLoading}
        canMutate={canMutate && !readOnly}
        onAction={handleAction}
      />
    </AdminSectionShell>
  );
}
