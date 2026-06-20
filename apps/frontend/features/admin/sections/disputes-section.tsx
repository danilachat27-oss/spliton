"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
  AdminSectionTabBar,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminSectionTab } from "@/features/admin/hooks/use-admin-section-tab";
import { useAuth } from "@/components/providers/auth-provider";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { fetchAllAdminPaginatedItems } from "@/services/admin/admin-api.util";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import {
  AdminDataTable,
  AdminErrorState,
  AdminFilterBar,
  AdminFilterResultCount,
  AdminLocalizedStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminDisputeDrawer } from "@/features/admin/sections/admin-dispute-drawer";
import {
  getAdminDisputesSummary,
  listAdminDisputesPaginated,
  type AdminDisputeListItem,
} from "@/services/admin/adminDisputes.service";
import { disputeTypeLabel } from "@/lib/i18n/disputes-messages";
import { cn } from "@/lib/utils";

const DISPUTE_TABS = [
  { id: "all", labelKey: "admin.disputes.tab.all" },
  { id: "open", labelKey: "admin.disputes.tab.open" },
  { id: "waiting_for_admin", labelKey: "admin.disputes.tab.waitingAdmin" },
  { id: "waiting_for_user", labelKey: "admin.disputes.tab.waitingUser" },
  { id: "escalated", labelKey: "admin.disputes.tab.escalated" },
  { id: "resolved", labelKey: "admin.disputes.tab.resolved" },
] as const;

type DisputeTab = (typeof DISPUTE_TABS)[number]["id"];

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
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

  return (
    <div className={cn(ADMIN_SECTION_TILE, "flex min-h-[5.5rem] flex-col justify-between gap-2")}>
      <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

function disputePriorityTone(priority: string): "neutral" | "danger" | "warning" {
  if (priority === "high" || priority === "critical") return "danger";
  if (priority === "medium") return "warning";
  return "neutral";
}

export function DisputesSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const searchParams = useSearchParams();
  const { user: actor } = useAuth();
  const canMutate =
    actor?.roles?.some((r) => ["SUPER_ADMIN", "ADMIN", "SUPPORT_MANAGER"].includes(r)) ?? false;
  const canReply =
    canMutate ||
    (actor?.roles?.some((r) => ["SUPPORT", "COMPLIANCE"].includes(r)) ?? false);

  const [tab, setTab] = useAdminSectionTab<DisputeTab>(
    DISPUTE_TABS.map((t) => t.id),
    "all",
  );
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [rows, setRows] = React.useState<AdminDisputeListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<{
    open: number;
    waitingAdmin: number;
    escalated: number;
    highPriority: number;
  } | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAllAdminPaginatedItems(
        (query) =>
          listAdminDisputesPaginated(
            { ...query, status: tab === "all" ? undefined : tab },
            client,
          ),
      ),
      getAdminDisputesSummary(client),
    ])
      .then(([items, s]) => {
        setRows(items);
        setSummary({
          open: s.open ?? 0,
          waitingAdmin: s.waitingAdmin ?? 0,
          escalated: s.escalated ?? 0,
          highPriority: s.highPriority ?? 0,
        });
      })
      .catch((e) => setError(localizedAdminError(e)))
      .finally(() => setLoading(false));
  }, [client, tab]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const dispute = searchParams.get("dispute");
    if (dispute) {
      setSelectedId(dispute);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  const filtered = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      row.id.toLowerCase().includes(q) ||
      row.userEmail.toLowerCase().includes(q) ||
      row.subject.toLowerCase().includes(q)
    );
  });

  const tabCounts = React.useMemo(() => {
    const counts: Record<DisputeTab, number> = {
      all: rows.length,
      open: 0,
      waiting_for_admin: 0,
      waiting_for_user: 0,
      escalated: 0,
      resolved: 0,
    };
    for (const r of rows) {
      if (r.status in counts) counts[r.status as DisputeTab] += 1;
    }
    return counts;
  }, [rows]);

  const columns: AdminColumn<AdminDisputeListItem>[] = [
    { key: "subject", header: a.table.name, render: (r) => r.subject },
    { key: "user", header: a.table.user, render: (r) => r.userEmail },
    {
      key: "type",
      header: a.table.type,
      render: (r) => disputeTypeLabel(r.type, a.locale),
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => <AdminLocalizedStatusBadge status={r.status} />,
    },
    {
      key: "priority",
      header: a.t("admin.disputes.priority"),
      render: (r) => (
        <AdminLocalizedStatusBadge status={r.priority} tone={disputePriorityTone(r.priority)} />
      ),
    },
    {
      key: "updated",
      header: a.table.updated,
      render: (r) => <span className="text-xs text-zinc-500">{formatAdminDate(r.updatedAt)}</span>,
    },
  ];

  return (
    <AdminSectionShell
      sectionId="disputes"
      title={a.adminSectionLabel("disputes")}
      infoHint="Очередь споров пользователей: статусы, приоритеты, назначение оператора и переписка по кейсу."
      actions={<AdminSectionRefreshButton onClick={load} />}
    >
      <AdminSectionPanel>
        {summary && !loading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            <StatTile label={a.t("admin.disputes.kpi.open")} value={summary.open} tone="info" />
            <StatTile
              label={a.t("admin.disputes.kpi.waitingAdmin")}
              value={summary.waitingAdmin}
              tone="warning"
            />
            <StatTile
              label={a.t("admin.disputes.kpi.escalated")}
              value={summary.escalated}
              tone={summary.escalated > 0 ? "danger" : "neutral"}
            />
            <StatTile
              label={a.t("admin.disputes.kpi.highPriority")}
              value={summary.highPriority}
              tone={summary.highPriority > 0 ? "danger" : "neutral"}
            />
          </div>
        ) : loading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(ADMIN_SECTION_TILE, "h-24 animate-pulse bg-zinc-800/50")} />
            ))}
          </div>
        ) : null}

        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          searchHint="Поиск по теме спора, email пользователя или ID."
          footer={
            <AdminFilterResultCount label={a.t("admin.filters.foundCount")} value={filtered.length} className="w-full" />
          }
          fields={[
            {
              id: "search",
              label: a.t("admin.filters.title"),
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: a.t("admin.disputes.searchPlaceholder"),
            },
          ]}
        />

        <AdminSectionTabBar
          tabs={DISPUTE_TABS.map((t) => ({
            id: t.id,
            label: a.t(t.labelKey),
            count: tabCounts[t.id],
          }))}
          activeId={tab}
          onChange={(id) => setTab(id as DisputeTab)}
        />

        <AdminSectionDataArea loading={loading} loadingLabel={a.t("admin.loading.disputes")}>
          {error ? (
            <AdminErrorState message={error} onRetry={load} />
          ) : (
            <AdminDataTable
              flat
              borderless
              className="[&_table]:min-w-[960px]"
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              onRowClick={(r) => {
                setSelectedId(r.id);
                setDrawerOpen(true);
              }}
              emptyMessage={a.t("admin.disputes.empty")}
            />
          )}
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminDisputeDrawer
        disputeId={selectedId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={load}
        canMutate={canMutate}
        canReply={canReply}
      />
    </AdminSectionShell>
  );
}
