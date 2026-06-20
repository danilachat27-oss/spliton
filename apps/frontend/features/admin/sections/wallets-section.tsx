"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Wallet } from "@/lib/lucide";

import { AdminWalletDrawer } from "@/features/admin/components/admin-wallet-drawer";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import {
  formatWalletOperation,
  formatWalletUserStatus,
  WALLET_FIELD_TOOLTIPS,
} from "@/features/admin/lib/admin-wallet-i18n";
import type { AdminWalletDetail, AdminWalletListItem } from "@/features/admin/mocks/admin-wallets.mock";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminSectionInfoHint,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import {
  getAdminWallet,
  getAdminWalletsSummary,
  listAdminWalletsPaginated,
  type AdminWalletsQuery,
} from "@/services/admin/adminWallets.service";
import { cn } from "@/lib/utils";

const WALLET_FILTER_OPTIONS_BASE = [
  { value: "all", label: "Все кошельки" },
  { value: "locked", labelKey: "admin.filter.lockedBalance" as const },
  { value: "pending_withdrawal", labelKey: "admin.filter.pendingWithdrawal" as const },
  { value: "pending_deposit", labelKey: "admin.filter.pendingDeposit" as const },
  { value: "risk", labelKey: "admin.filter.riskFlags" as const },
  { value: "recent_activity", label: "Активность 7 дней" },
];

const USER_STATUS_OPTIONS_BASE = [
  { value: "all", label: "Все пользователи" },
  { value: "active", labelKey: "admin.filter.userActive" as const },
  { value: "blocked", labelKey: "admin.filter.userBlocked" as const },
  { value: "staff", labelKey: "admin.filter.userStaff" as const },
  { value: "risk", labelKey: "admin.filter.userRisk" as const },
];

const SORT_OPTIONS = [
  { value: "last_activity", label: "Последняя активность" },
  { value: "available", label: "Больше available" },
  { value: "locked", label: "Больше locked" },
];

function parseUsdtNumber(value: string): number {
  return Number(value.replace(/[^\d.-]/g, ""));
}

function WalletAssetCell({ assetCode, network }: { assetCode: string; network: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs font-semibold text-zinc-100">
        {assetCode}
      </span>
      <span className="rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {network}
      </span>
    </div>
  );
}

function WalletZeroUsdt({ value }: { value: string }) {
  return <span className="text-sm tabular-nums text-zinc-500">{formatUsdtAmount(value)}</span>;
}

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
  return (
    <div className={cn(ADMIN_SECTION_TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

export function WalletsSection() {
  const a = useAdminI18n();
  const walletFilterOptions = React.useMemo(
    () =>
      WALLET_FILTER_OPTIONS_BASE.map((opt) => ({
        value: opt.value,
        label: "labelKey" in opt && opt.labelKey ? a.t(opt.labelKey) : opt.label,
      })),
    [a],
  );
  const userStatusOptions = React.useMemo(
    () =>
      USER_STATUS_OPTIONS_BASE.map((opt) => ({
        value: opt.value,
        label: "labelKey" in opt && opt.labelKey ? a.t(opt.labelKey) : opt.label,
      })),
    [a],
  );
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const isReadOnly = perms.readOnly("Wallets");
  const canViewAudit = perms.can("Audit Log", "view");

  const loader = React.useCallback(
    (q: AdminWalletsQuery) => listAdminWalletsPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);

  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getAdminWalletsSummary>> | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [walletFilter, setWalletFilter] = React.useState("all");
  const [userStatus, setUserStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("last_activity");
  const [minAvailable, setMinAvailable] = React.useState("");
  const [maxAvailable, setMaxAvailable] = React.useState("");
  const [minLocked, setMinLocked] = React.useState("");
  const [maxLocked, setMaxLocked] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AdminWalletDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const loadSummary = React.useCallback(async () => {
    setSummaryLoading(true);
    try {
      setSummary(await getAdminWalletsSummary(client));
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: search || undefined,
      walletFilter: walletFilter === "all" ? undefined : walletFilter,
      userStatus: userStatus === "all" ? undefined : userStatus,
      sortBy: sortBy || "last_activity",
      sortDir: "desc",
      minAvailable: minAvailable || undefined,
      maxAvailable: maxAvailable || undefined,
      minLocked: minLocked || undefined,
      maxLocked: maxLocked || undefined,
      asset: "USDT",
      network: "TRC20",
    }));
  }, [search, walletFilter, userStatus, sortBy, minAvailable, maxAvailable, minLocked, maxLocked, setQuery]);

  async function openDetail(row: AdminWalletListItem) {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail({
      ...row,
      createdAt: row.lastTransactionAt,
      updatedAt: row.lastTransactionAt,
    });
    try {
      const include = canViewAudit
        ? "transactions,deposits,withdrawals,market,risk,audit"
        : "transactions,deposits,withdrawals,market,risk";
      const loaded = await getAdminWallet(row.id, client, include);
      if (loaded) setDetail(loaded);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Не удалось загрузить кошелёк");
    } finally {
      setDetailLoading(false);
    }
  }

  const columns: AdminColumn<AdminWalletListItem>[] = [
    {
      key: "user",
      header: a.table.user,
      render: (r) => (
        <div className="min-w-[180px]">
          <Link
            href={ROUTES.adminUserDetail(r.userId)}
            className="text-sm font-medium text-zinc-100 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {r.userEmail}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
            {r.userDisplayName ? <span>{r.userDisplayName}</span> : null}
            {r.userRoles[0] ? (
              <span className="text-zinc-600">{a.adminRoleLabel(r.userRoles[0]) ?? r.userRoles[0]}</span>
            ) : null}
          </div>
          <div className="mt-1">
            <AdminStatusBadge
              label={formatWalletUserStatus(r.userStatus)}
              tone={r.userStatus === "active" ? "success" : "neutral"}
            />
          </div>
        </div>
      ),
    },
    {
      key: "walletId",
      header: a.t("admin.table.walletId"),
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
          {r.id.slice(0, 8)}…
          <AdminCopyButton value={r.id} />
        </span>
      ),
    },
    {
      key: "asset",
      header: a.table.asset,
      render: (r) => <WalletAssetCell assetCode={r.assetCode} network={r.network} />,
    },
    {
      key: "avail",
      header: a.table.available,
      render: (r) => (
        <span
          className={cn(
            "tabular-nums font-medium",
            r.isAnomalous ? "text-red-700" : "text-zinc-100",
          )}
          title={WALLET_FIELD_TOOLTIPS.available}
        >
          {formatUsdtAmount(r.availableUsdt)}
        </span>
      ),
    },
    {
      key: "locked",
      header: a.table.locked,
      render: (r) => {
        const locked = parseUsdtNumber(r.lockedUsdt);
        return locked > 0 ? (
          <AdminStatusBadge label={formatUsdtAmount(r.lockedUsdt)} tone="warning" />
        ) : (
          <WalletZeroUsdt value="0" />
        );
      },
    },
    {
      key: "pending",
      header: a.t("admin.table.pendingCol"),
      render: (r) =>
        parseUsdtNumber(r.pendingUsdt) > 0 ? (
          <AdminStatusBadge label={formatUsdtAmount(r.pendingUsdt)} tone="pending" />
        ) : (
          <WalletZeroUsdt value="0" />
        ),
    },
    {
      key: "earned",
      header: a.t("admin.kpi.wallets.accrued"),
      render: (r) => (
        <span className="tabular-nums text-zinc-200">{formatUsdtAmount(r.earnedTotalUsdt)}</span>
      ),
    },
    {
      key: "withdrawn",
      header: a.t("admin.kpi.wallets.withdrawn"),
      render: (r) => (
        <span className="tabular-nums text-zinc-200">{formatUsdtAmount(r.withdrawnTotalUsdt)}</span>
      ),
    },
    {
      key: "deposits",
      header: a.t("admin.wallets.col.deposited"),
      render: (r) => (
        <span className="tabular-nums text-zinc-300">{formatUsdtAmount(r.depositsTotalUsdt)}</span>
      ),
    },
    {
      key: "lastOp",
      header: a.t("admin.wallets.col.lastOperation"),
      render: (r) => {
        if (!r.lastOperationType) {
          return <span className="text-sm text-zinc-500">{a.t("admin.wallets.noOperations")}</span>;
        }
        return (
          <div className="min-w-[140px] text-xs">
            <p className="font-medium text-zinc-200">{formatWalletOperation(r.lastOperationType)}</p>
            <p className="mt-0.5 tabular-nums text-zinc-500">{formatAdminDate(r.lastTransactionAt)}</p>
          </div>
        );
      },
    },
    {
      key: "risk",
      header: a.table.risk,
      render: (r) =>
        r.hasRiskFlag ? (
          <AdminStatusBadge label={a.formatAdminStatus(r.riskSeverity ?? "warning")} tone="danger" />
        ) : (
          <span className="text-sm text-zinc-500">{a.t("admin.wallets.risk.none")}</span>
        ),
    },
    {
      key: "open",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800/60"
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

  const topByAvailable = [...page.items]
    .sort((a, b) => Number(b.availableUsdt.replace(/\s/g, "")) - Number(a.availableUsdt.replace(/\s/g, "")))
    .slice(0, 3);

  return (
    <AdminSectionShell
      sectionId="wallets"
      title={a.adminSectionLabel("wallets")}
      actions={
        <AdminSectionRefreshButton
          onClick={() => {
            reload();
            void loadSummary();
          }}
        />
      }
    >
      {isReadOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("wallets")} /> : null}

      <AdminSectionInfoHint>
        Контроль пользовательских балансов Spliton: доступные и заблокированные средства, начисления, выводы и
        ledger-операции. Live mode — только данные из API.
      </AdminSectionInfoHint>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatTile
          label={a.t("admin.kpi.wallets.totalAvailable")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalAvailableUsdt ?? "0")}
          tone="success"
        />
        <StatTile
          label={a.t("admin.kpi.holdings.locked")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalLockedUsdt ?? "0")}
          tone="warning"
        />
        <StatTile
          label={a.t("admin.kpi.pending")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalPendingUsdt ?? "0")}
        />
        <StatTile
          label={a.t("admin.kpi.holdings.accrued")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalEarnedUsdt ?? "0")}
          tone="info"
        />
        <StatTile
          label={a.t("admin.kpi.wallets.withdrawn")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalWithdrawnUsdt ?? "0")}
        />
        <StatTile
          label={a.t("admin.wallets.pendingWithdrawals")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.pendingWithdrawalsUsdt ?? "0")}
          tone="warning"
        />
        <StatTile
          label={a.t("admin.wallets.pendingDeposits")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.pendingDepositsUsdt ?? "0")}
        />
        <StatTile
          label={a.t("admin.kpi.wallets.activeWallets")}
          value={summaryLoading ? "…" : String(summary?.activeWalletsCount ?? 0)}
        />
        <StatTile
          label={a.t("admin.filter.riskFlags")}
          value={summaryLoading ? "…" : String(summary?.walletsWithRiskFlags ?? 0)}
          tone="warning"
        />
        <StatTile
          label={a.t("admin.kpi.wallets.anomalies")}
          value={summaryLoading ? "…" : String(summary?.anomalousWalletsCount ?? 0)}
          tone={(summary?.anomalousWalletsCount ?? 0) > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className={cn(ADMIN_SECTION_TILE, "lg:col-span-2 space-y-2")}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Топ по available (на странице)
          </p>
          {topByAvailable.length ? (
            <ul className="space-y-2 text-sm">
              {topByAvailable.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate">
                    <Wallet className="size-3.5 shrink-0 text-zinc-500" />
                    {w.userEmail}
                  </span>
                  <span className="shrink-0 tabular-nums font-medium">{formatUsdtAmount(w.availableUsdt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Нет данных на текущей странице.</p>
          )}
        </div>
        <div className={cn(ADMIN_SECTION_TILE, "space-y-2")}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Аналитика</p>
          <Link
            href={ROUTES.adminAnalyticsFinance}
            className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:underline"
          >
            <BarChart3 className="size-3.5" /> Финансовая аналитика
          </Link>
        </div>
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
              placeholder: "Email, user id, wallet id…",
            },
            {
              id: "filter",
              label: "Фильтр",
              type: "select",
              value: walletFilter,
              onChange: setWalletFilter,
              options: walletFilterOptions,
            },
            {
              id: "userStatus",
              label: "Пользователь",
              type: "select",
              value: userStatus,
              onChange: setUserStatus,
              options: userStatusOptions,
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
              id: "minAvailable",
              label: a.t("admin.filters.minAvailable"),
              type: "search",
              value: minAvailable,
              onChange: setMinAvailable,
              placeholder: "0",
            },
            {
              id: "maxAvailable",
              label: a.t("admin.filters.maxAvailable"),
              type: "search",
              value: maxAvailable,
              onChange: setMaxAvailable,
              placeholder: a.t("admin.wallets.filter.maxPlaceholder"),
            },
            {
              id: "minLocked",
              label: a.t("admin.filters.minLocked"),
              type: "search",
              value: minLocked,
              onChange: setMinLocked,
              placeholder: "0",
            },
            {
              id: "maxLocked",
              label: a.t("admin.filters.maxLocked"),
              type: "search",
              value: maxLocked,
              onChange: setMaxLocked,
              placeholder: a.t("admin.wallets.filter.maxPlaceholder"),
            },
          ]}
        />

        <AdminSectionDataArea loading={loading} error={error} onRetry={reload} loadingLabel="Загрузка кошельков…">
          <AdminDataTable
            flat
            columns={columns}
            rows={page.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => void openDetail(r)}
            emptyMessage={
              !loading && !error && page.items.length === 0
                ? "Кошельки появятся после первой финансовой операции пользователя."
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

      {detailError ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-300" role="alert">
          {detailError}
        </p>
      ) : null}

      <AdminWalletDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        wallet={detail}
        loading={detailLoading}
        canViewAudit={canViewAudit}
      />
    </AdminSectionShell>
  );
}
