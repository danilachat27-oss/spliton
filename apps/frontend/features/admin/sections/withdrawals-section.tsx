"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3, Info } from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminWithdrawalDrawer,
  type WithdrawalPendingAction,
} from "@/features/admin/components/admin-withdrawal-drawer";
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
  tronTxExplorerUrl,
  withdrawalStatusLabel,
  withdrawalStatusTone,
} from "@/features/admin/lib/admin-withdrawal-i18n";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AdminWithdrawalDetail, AdminWithdrawalListItem } from "@/features/admin/mocks/admin-withdrawals.mock";
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
  getAdminWithdrawal,
  getAdminWithdrawalsSummary,
  listAdminWithdrawalsPaginated,
  patchAdminWithdrawal,
  type AdminWithdrawalsQuery,
} from "@/services/admin/adminWithdrawals.service";
import { cn } from "@/lib/utils";

const WITHDRAWAL_FILTER_OPTIONS_BASE = [
  { value: "all", label: "Все выводы" },
  { value: "pending_queue", label: "Очередь обработки" },
  { value: "high_value", labelKey: "admin.filters.highValue" as const },
  { value: "on_hold", label: "На удержании" },
  { value: "failed", label: "Ошибочные" },
  { value: "no_tx_hash", label: "Без tx hash" },
  { value: "with_risk", label: "С риск-флагами" },
];

const STATUS_OPTIONS_BASE = [
  { value: "pending", label: withdrawalStatusLabel("pending") },
  { value: "approved", label: withdrawalStatusLabel("approved") },
  { value: "on_hold", label: withdrawalStatusLabel("on_hold") },
  { value: "completed", label: withdrawalStatusLabel("completed") },
  { value: "rejected", label: withdrawalStatusLabel("rejected") },
  { value: "failed", label: withdrawalStatusLabel("failed") },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "amount", label: "Крупнее сумма" },
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
      ? "text-emerald-800"
      : tone === "warning"
        ? "text-amber-800"
        : tone === "info"
          ? "text-sky-800"
          : tone === "danger"
            ? "text-red-800"
            : "text-zinc-100";
  return (
    <div className={cn(ADMIN_SECTION_TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

export function WithdrawalsSection() {
  return (
    <React.Suspense fallback={<div className="p-8 text-sm text-zinc-500">Загрузка выводов…</div>}>
      <WithdrawalsSectionInner />
    </React.Suspense>
  );
}

function WithdrawalsSectionInner() {
  const a = useAdminI18n();
  const statusOptions = React.useMemo(
    () => [{ value: "all", label: a.actions.allStatuses }, ...STATUS_OPTIONS_BASE],
    [a],
  );
  const withdrawalFilterOptions = React.useMemo(
    () =>
      WITHDRAWAL_FILTER_OPTIONS_BASE.map((opt) =>
        "labelKey" in opt && opt.labelKey
          ? { value: opt.value, label: a.t(opt.labelKey) }
          : { value: opt.value, label: opt.label },
      ),
    [a],
  );
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const searchParams = useSearchParams();
  const readOnly = perms.readOnly("Withdrawals");
  const canMutate = perms.can("Withdrawals", "approve") || perms.can("Withdrawals", "update");

  const loader = React.useCallback(
    (q: AdminWithdrawalsQuery) => listAdminWithdrawalsPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);

  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getAdminWithdrawalsSummary>> | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState(() => {
    const s = searchParams.get("status");
    if (s === "requested") return "pending";
    return s ?? "all";
  });
  const [withdrawalFilter, setWithdrawalFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [minAmount, setMinAmount] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AdminWithdrawalDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const summaryQuery = React.useMemo(
    () => ({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    [dateFrom, dateTo],
  );

  const loadSummary = React.useCallback(async () => {
    setSummaryLoading(true);
    try {
      setSummary(await getAdminWithdrawalsSummary(client, summaryQuery));
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
      withdrawalFilter: withdrawalFilter === "all" ? undefined : withdrawalFilter,
      sortBy: sortBy === "newest" ? undefined : sortBy,
      sortDir: sortBy === "oldest" ? "asc" : "desc",
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minAmount: minAmount || undefined,
    }));
  }, [search, statusFilter, withdrawalFilter, sortBy, dateFrom, dateTo, minAmount, setQuery]);

  async function openDetail(row: AdminWithdrawalListItem) {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetail({ ...row });
    try {
      const loaded = await getAdminWithdrawal(row.id, client);
      if (loaded) setDetail(loaded);
    } catch {
      /* keep list preview */
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAction(action: WithdrawalPendingAction, note: string, txHash: string) {
    if (!detail) return;
    setActionError(null);
    try {
      const id = detail.id;
      await patchAdminWithdrawal(id, action.action, note || undefined, client, txHash || undefined);
      const refreshed = await getAdminWithdrawal(id, client);
      if (refreshed) setDetail(refreshed);
      await reload();
      void loadSummary();
    } catch (e) {
      setActionError(localizedAdminError(e));
      throw e;
    }
  }

  const columns: AdminColumn<AdminWithdrawalListItem>[] = [
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
    { key: "fee", header: a.table.fee, render: (r) => <span className="tabular-nums">{formatUsdtAmount(r.feeUsdt)}</span> },
    {
      key: "net",
      header: a.table.net,
      render: (r) => <span className="tabular-nums font-medium">{formatUsdtAmount(r.finalAmountUsdt)}</span>,
    },
    {
      key: "addr",
      header: a.t("admin.table.trc20"),
      render: (r) => (
        <span className="inline-flex max-w-[100px] items-center gap-1 truncate font-mono text-[10px]">
          {r.trc20Address.slice(0, 8)}…
          <AdminCopyButton value={r.trc20Address} />
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
      key: "status",
      header: a.table.status,
      render: (r) => (
        <div className="flex flex-col gap-1">
          <AdminStatusBadge label={withdrawalStatusLabel(r.status)} tone={withdrawalStatusTone(r.status)} />
          {r.hasRiskFlag ? <AdminStatusBadge label={r.riskSeverity ?? "risk"} tone="danger" /> : null}
        </div>
      ),
    },
    {
      key: "requested",
      header: "Запрошено",
      render: (r) => (
        <span className="whitespace-nowrap text-xs tabular-nums">{formatAdminDate(r.requestedAt)}</span>
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
      sectionId="withdrawals"
      title={a.adminSectionLabel("withdrawals")}
      actions={
        <AdminSectionRefreshButton
          onClick={() => {
            reload();
            void loadSummary();
          }}
        />
      }
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("withdrawals")} /> : null}

      <div className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3.5 shadow-sm shadow-zinc-900/[0.03]">
        <Info className="mt-0.5 size-4 shrink-0 text-zinc-400" strokeWidth={2} />
        <p className="text-sm leading-relaxed text-zinc-400">
          Контроль исходящих USDT TRC20 выводов Spliton: одобрение, блокировка средств, отправка в сеть и списание через
          wallet ledger.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatTile
          label={a.t("admin.kpi.withdrawals.totalWithdrawn")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalWithdrawnUsdt ?? "0")}
          tone="success"
        />
        <StatTile label={a.t("admin.kpi.pending")} value={summaryLoading ? "…" : String(summary?.pendingCount ?? 0)} tone="info" />
        <StatTile label={a.t("admin.kpi.onHold")} value={summaryLoading ? "…" : String(summary?.onHoldCount ?? 0)} tone="warning" />
        <StatTile label={a.t("admin.kpi.processing")} value={summaryLoading ? "…" : String(summary?.approvedCount ?? 0)} tone="info" />
        <StatTile label={a.t("admin.kpi.completed")} value={summaryLoading ? "…" : String(summary?.completedCount ?? 0)} tone="success" />
        <StatTile label={a.t("admin.kpi.errors")} value={summaryLoading ? "…" : String(summary?.failedCount ?? 0)} tone="danger" />
        <StatTile
          label={a.t("admin.kpi.withdrawals.avgTime")}
          value={
            summaryLoading
              ? "…"
              : summary?.avgProcessingMinutes != null
                ? `${summary.avgProcessingMinutes} мин`
                : "—"
          }
        />
        <StatTile label={a.t("admin.withdrawals.highValue")} value={summaryLoading ? "…" : String(summary?.highValueCount ?? 0)} tone="warning" />
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
              value: withdrawalFilter,
              onChange: setWithdrawalFilter,
              options: withdrawalFilterOptions,
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

        <AdminSectionDataArea loading={loading} error={error} onRetry={reload} loadingLabel="Загрузка выводов…">
          <AdminDataTable
            flat
            columns={columns}
            rows={page.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => void openDetail(r)}
            emptyMessage={
              !loading && !error && page.items.length === 0 ? "Выводов пока нет." : a.empty.noData
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

      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

      <AdminWithdrawalDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        withdrawal={detail}
        loading={detailLoading}
        canMutate={canMutate && !readOnly}
        onAction={handleAction}
      />
    </AdminSectionShell>
  );
}
