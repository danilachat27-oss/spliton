"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Layers, User } from "@/lib/lucide";

import { AdminHoldingDrawer } from "@/features/admin/components/admin-holding-drawer";
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
import {
  formatLockReason,
  formatUnitsWithLabel,
  releaseStatusLabel,
} from "@/features/admin/lib/admin-holding-i18n";
import { formatAdminDate, formatUnits, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminBtnGhost } from "@/features/admin/lib/admin-ui";
import type { AdminHoldingDetail, AdminHoldingListItem } from "@/features/admin/mocks/admin-holdings.mock";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminFilterPills,
  AdminFilterResultCount,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import {
  getAdminHolding,
  getAdminHoldingsSummary,
  listAdminHoldingsPaginated,
  type AdminHoldingsQuery,
} from "@/services/admin/adminHoldings.service";
import { cn } from "@/lib/utils";

const HOLDING_FILTER_OPTIONS_BASE = [
  { value: "all", label: "Все владения" },
  { value: "locked", label: "Есть заблокированные" },
  { value: "listing", label: "Активное объявление" },
  { value: "earned", label: "Есть начисления" },
  { value: "risk", labelKey: "admin.filter.riskFlags" as const },
];

const SORT_OPTIONS = [
  { value: "last_activity", label: "Последняя активность" },
  { value: "total_units", label: "Больше всего юнитов" },
  { value: "locked_units", label: "Больше всего заблокировано" },
  { value: "earned_total", label: "Больше всего начислено" },
  { value: "current_value", label: "Текущая стоимость" },
];

const adminTableLink =
  "text-sm font-medium text-zinc-100 transition-colors hover:text-[#B7F500]";

function ReleaseCoverThumb({ coverUrl }: { coverUrl: string | null }) {
  const [failed, setFailed] = React.useState(false);
  const showPlaceholder = !coverUrl?.trim() || failed;

  if (showPlaceholder) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-500">
        <Layers className="size-4" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-zinc-800/60">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl!.trim()}
        alt=""
        className="size-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function statValueSize(value: string): string {
  if (value === "…") return "text-2xl";
  const len = value.replace(/\s/g, "").length;
  if (len > 16) return "text-base leading-snug sm:text-lg";
  if (len > 11) return "text-lg sm:text-xl";
  return "text-2xl";
}

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "info"
          ? "text-sky-400"
          : "text-zinc-100";
  return (
    <div className={cn(ADMIN_SECTION_TILE, "flex min-h-[5.5rem] min-w-0 flex-col justify-between gap-2")}>
      <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-zinc-500">{label}</p>
      <p
        className={cn("font-semibold tabular-nums tracking-tight break-words", statValueSize(value), valueClass)}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export function HoldingsSection() {
  const a = useAdminI18n();
  const releaseStatusOptions = React.useMemo(
    () => [
      { value: "all", label: a.actions.allStatuses },
      { value: "active", label: a.formatTrackStatus("active") },
      { value: "draft", label: a.formatTrackStatus("draft") },
      { value: "paused", label: a.formatTrackStatus("paused") },
    ],
    [a],
  );
  const holdingFilterOptions = React.useMemo(
    () =>
      HOLDING_FILTER_OPTIONS_BASE.map((opt) => ({
        value: opt.value,
        label: "labelKey" in opt && opt.labelKey ? a.t(opt.labelKey) : opt.label,
      })),
    [a],
  );
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const isReadOnly = perms.readOnly("Holdings");
  const canViewWallet = perms.can("Wallets", "view");

  const loader = React.useCallback(
    (q: AdminHoldingsQuery) => listAdminHoldingsPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);

  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getAdminHoldingsSummary>> | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [holdingFilter, setHoldingFilter] = React.useState("all");
  const [releaseStatus, setReleaseStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("last_activity");
  const [minUnits, setMinUnits] = React.useState("");
  const [maxUnits, setMaxUnits] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AdminHoldingDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const loadSummary = React.useCallback(async () => {
    setSummaryLoading(true);
    try {
      setSummary(await getAdminHoldingsSummary(client));
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const sortOptions = React.useMemo(
    () =>
      SORT_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    [],
  );

  const activeUnitFilters = (minUnits ? 1 : 0) + (maxUnits ? 1 : 0);

  const resetExtraFilters = React.useCallback(() => {
    setMinUnits("");
    setMaxUnits("");
  }, []);

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: search || undefined,
      holdingFilter: holdingFilter === "all" ? undefined : holdingFilter,
      releaseStatus: releaseStatus === "all" ? undefined : releaseStatus,
      sortBy,
      sortDir: "desc",
      minUnits: minUnits || undefined,
      maxUnits: maxUnits || undefined,
    }));
  }, [search, holdingFilter, releaseStatus, sortBy, minUnits, maxUnits, setQuery]);

  async function openDetail(row: AdminHoldingListItem) {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetail(row);
    try {
      const include = canViewWallet
        ? "history,distributions,market,wallet,risk"
        : "history,distributions,market,risk";
      setDetail(await getAdminHolding(row.id, client, include));
    } catch {
      setDetail(row);
    } finally {
      setDetailLoading(false);
    }
  }

  const columns: AdminColumn<AdminHoldingListItem>[] = [
    {
      key: "holder",
      header: a.table.holder,
      render: (r) => (
        <div className="min-w-[168px]">
          <Link
            href={ROUTES.adminUserDetail(r.userId)}
            className={adminTableLink}
            onClick={(e) => e.stopPropagation()}
          >
            {r.userEmail}
          </Link>
          {r.userDisplayName ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{r.userDisplayName}</p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <AdminStatusBadge label={r.userStatus} tone={r.userStatus === "active" ? "success" : "neutral"} />
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
              {r.userId.slice(0, 8)}…
              <AdminCopyButton value={r.userId} />
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "release",
      header: "Релиз",
      render: (r) => (
        <div className="flex min-w-[156px] items-center gap-2.5">
          <ReleaseCoverThumb coverUrl={r.trackCoverUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">{r.trackTitle}</p>
            <p className="truncate text-xs text-zinc-500">{r.trackArtist}</p>
            <div className="mt-1">
              <AdminStatusBadge label={releaseStatusLabel(r.trackStatus)} tone="neutral" />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "units",
      header: "Юниты",
      render: (r) => (
        <div className="tabular-nums">
          <p className="text-sm font-medium text-zinc-100">{formatUnits(r.totalUnits)}</p>
          <p className="text-xs text-zinc-500">{formatUnits(r.availableUnits)} доступно</p>
        </div>
      ),
    },
    {
      key: "locked",
      header: a.table.locked,
      render: (r) => {
        const locked = Number(r.lockedUnits);
        return (
          <div className="min-w-[72px]">
            {locked > 0 ? (
              <AdminStatusBadge label={formatUnits(r.lockedUnits)} tone="warning" />
            ) : (
              <span className="text-sm tabular-nums text-zinc-500">0</span>
            )}
            {r.lockReason ? (
              <p className="mt-1 text-[11px] leading-snug text-zinc-500">{formatLockReason(r.lockReason)}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "value",
      header: "Оценка",
      render: (r) => (
        <div className="min-w-[96px] tabular-nums">
          <p className="text-sm font-medium text-zinc-100">{formatUsdtAmount(r.currentValueUsdt)}</p>
          <p className="text-xs text-zinc-500">ср. {formatUsdtAmount(r.averagePriceUsdt)}</p>
        </div>
      ),
    },
    {
      key: "earned",
      header: "Начислено",
      render: (r) => {
        const earned = Number(String(r.earnedTotalUsdt).replace(/[^\d.-]/g, ""));
        return (
          <span
            className={cn(
              "whitespace-nowrap text-sm tabular-nums font-medium",
              earned > 0 ? "text-emerald-400" : "text-zinc-500",
            )}
          >
            {formatUsdtAmount(r.earnedTotalUsdt)}
          </span>
        );
      },
    },
    {
      key: "listings",
      header: a.t("admin.table.listings"),
      className: "w-20",
      render: (r) =>
        r.activeListingsCount > 0 ? (
          <AdminStatusBadge label={String(r.activeListingsCount)} tone="pending" />
        ) : (
          <span className="text-sm tabular-nums text-zinc-500">0</span>
        ),
    },
    {
      key: "activity",
      header: "Активность",
      render: (r) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-zinc-400">
          {formatAdminDate(r.lastActivityAt)}
        </span>
      ),
    },
    {
      key: "risk",
      header: a.table.risk,
      className: "w-16",
      render: (r) =>
        r.hasRiskFlag ? (
          <AdminStatusBadge label={r.riskSeverity ?? "flag"} tone="danger" />
        ) : (
          <span className="text-sm tabular-nums text-zinc-500">0</span>
        ),
    },
    {
      key: "open",
      header: "",
      className: "w-px whitespace-nowrap text-right",
      render: (r) => (
        <button
          type="button"
          className={cn(adminBtnGhost, "h-8 shrink-0 px-3")}
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

  const topByUnits = [...page.items].sort((a, b) => Number(b.totalUnits) - Number(a.totalUnits)).slice(0, 3);

  return (
    <AdminSectionShell
      sectionId="holdings"
      title={a.adminSectionLabel("holdings")}
      infoHint={a.t("admin.holdings.infoHint")}
      actions={
        <AdminSectionRefreshButton
          onClick={() => {
            reload();
            void loadSummary();
          }}
        />
      }
    >
      {isReadOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("holdings")} /> : null}

      <div className={ADMIN_SECTION_KPI_GRID}>
        <StatTile
          label={a.t("admin.kpi.holdings.holders")}
          value={summaryLoading ? "…" : String(summary?.totalHolders ?? 0)}
          tone="info"
        />
        <StatTile
          label={a.t("admin.kpi.holdings.unitsInCirculation")}
          value={summaryLoading ? "…" : formatUnits(summary?.totalUnits ?? "0")}
        />
        <StatTile
          label={a.t("admin.kpi.holdings.available")}
          value={summaryLoading ? "…" : formatUnits(summary?.availableUnits ?? "0")}
          tone="success"
        />
        <StatTile
          label={a.t("admin.kpi.holdings.locked")}
          value={summaryLoading ? "…" : formatUnits(summary?.lockedUnits ?? "0")}
          tone="warning"
        />
        <StatTile
          label={a.t("admin.kpi.holdings.currentValue")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalCurrentValueUsdt ?? "0")}
        />
        <StatTile
          label={a.t("admin.kpi.holdings.accrued")}
          value={summaryLoading ? "…" : formatUsdtAmount(summary?.totalEarnedUsdt ?? "0")}
          tone="success"
        />
        <StatTile
          label={a.t("admin.holdings.activeListings")}
          value={summaryLoading ? "…" : String(summary?.activeListingsCount ?? 0)}
        />
        <StatTile
          label={a.t("admin.filter.riskFlags")}
          value={summaryLoading ? "…" : String(summary?.holdingsWithRiskFlags ?? 0)}
          tone="warning"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className={cn(ADMIN_SECTION_TILE, "lg:col-span-2 space-y-2")}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Топ держатели (на странице)</p>
          {topByUnits.length ? (
            <ul className="space-y-2 text-sm">
              {topByUnits.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate">
                    <User className="size-3.5 shrink-0 text-zinc-500" />
                    {h.userEmail} · {h.trackTitle}
                  </span>
                  <span className="shrink-0 tabular-nums font-medium">{formatUnitsWithLabel(h.totalUnits)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Нет данных на текущей странице.</p>
          )}
        </div>
        <div className={cn(ADMIN_SECTION_TILE, "space-y-2")}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Аналитика</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link
              href={ROUTES.adminAnalyticsTracks}
              className="inline-flex items-center gap-1 text-zinc-300 transition-colors hover:text-[#B7F500]"
            >
              <BarChart3 className="size-3.5" /> Аналитика треков
            </Link>
            <Link
              href={ROUTES.adminAnalyticsUsers}
              className="inline-flex items-center gap-1 text-zinc-300 transition-colors hover:text-[#B7F500]"
            >
              <BarChart3 className="size-3.5" /> Аналитика пользователей
            </Link>
            <Link
              href={ROUTES.adminAnalyticsMarket}
              className="inline-flex items-center gap-1 text-zinc-300 transition-colors hover:text-[#B7F500]"
            >
              <BarChart3 className="size-3.5" /> Аналитика рынка
            </Link>
          </div>
        </div>
      </div>

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          panelWidthClassName="w-[min(100vw-1rem,520px)]"
          searchHint={a.t("admin.holdings.search.hint")}
          extraActiveCount={activeUnitFilters}
          onReset={resetExtraFilters}
          footer={
            <AdminFilterResultCount
              label={a.t("admin.filters.foundCount")}
              value={page.total}
              className="w-full"
            />
          }
          fields={[
            {
              id: "search",
              label: a.t("admin.holdings.search.label"),
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: a.t("admin.holdings.search.placeholder"),
            },
            {
              id: "minUnits",
              label: a.t("admin.filters.minUnits"),
              type: "number",
              value: minUnits,
              onChange: setMinUnits,
              placeholder: "0",
            },
            {
              id: "maxUnits",
              label: a.t("admin.filters.maxUnits"),
              type: "number",
              value: maxUnits,
              onChange: setMaxUnits,
              placeholder: "∞",
            },
            {
              id: "filter",
              label: a.t("admin.holdings.filter.label"),
              type: "select",
              value: holdingFilter,
              onChange: setHoldingFilter,
              options: holdingFilterOptions,
            },
            {
              id: "releaseStatus",
              label: a.t("admin.holdings.filter.releaseStatus"),
              type: "select",
              value: releaseStatus,
              onChange: setReleaseStatus,
              options: releaseStatusOptions,
            },
            {
              id: "sort",
              label: a.t("admin.filters.sort"),
              type: "select",
              value: sortBy,
              onChange: setSortBy,
              options: sortOptions,
            },
          ]}
        />

        <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900/25 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
          <AdminFilterPills
            label={a.t("admin.holdings.filter.label")}
            value={holdingFilter}
            onChange={setHoldingFilter}
            options={holdingFilterOptions}
          />
          <AdminFilterPills
            label={a.t("admin.holdings.filter.releaseStatus")}
            value={releaseStatus}
            onChange={setReleaseStatus}
            options={releaseStatusOptions}
          />
        </div>

        <AdminSectionDataArea
          loading={loading}
          error={error}
          onRetry={reload}
          loadingLabel="Загрузка владений…"
        >
          <AdminDataTable
            flat
            borderless
            className="[&_table]:min-w-[1080px]"
            columns={columns}
            rows={page.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => void openDetail(r)}
            emptyMessage={
              !loading && !error && page.items.length === 0
                ? "Пока нет владений. Юниты появятся после первой покупки пользователем."
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

      <AdminHoldingDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        holding={detail}
        loading={detailLoading}
        canViewWallet={canViewWallet}
      />
    </AdminSectionShell>
  );
}
