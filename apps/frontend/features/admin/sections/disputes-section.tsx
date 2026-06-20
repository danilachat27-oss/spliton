"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
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
import { ADMIN_SECTION_FILTERS } from "@/features/admin/lib/admin-section-styles";
import {
  AdminDataTable,
  AdminErrorState,
  AdminLocalizedStatusBadge,
  AdminLoadingState,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminDisputeDrawer } from "@/features/admin/sections/admin-dispute-drawer";
import {
  getAdminDisputesSummary,
  listAdminDisputesPaginated,
  type AdminDisputeListItem,
} from "@/services/admin/adminDisputes.service";

const DISPUTE_TABS = [
  { id: "all", labelKey: "admin.disputes.tab.all" },
  { id: "open", labelKey: "admin.disputes.tab.open" },
  { id: "waiting_for_admin", labelKey: "admin.disputes.tab.waitingAdmin" },
  { id: "waiting_for_user", labelKey: "admin.disputes.tab.waitingUser" },
  { id: "escalated", labelKey: "admin.disputes.tab.escalated" },
  { id: "resolved", labelKey: "admin.disputes.tab.resolved" },
] as const;

type DisputeTab = (typeof DISPUTE_TABS)[number]["id"];

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
          open: s.open,
          waitingAdmin: s.waitingAdmin,
          escalated: s.escalated,
          highPriority: s.highPriority,
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

  const columns: AdminColumn<AdminDisputeListItem>[] = [
    { key: "subject", header: a.table.name, render: (r) => r.subject },
    { key: "user", header: a.table.user, render: (r) => r.userEmail },
    { key: "type", header: a.table.type, render: (r) => r.type },
    {
      key: "status",
      header: a.table.status,
      render: (r) => {
        const { status: rowStatus } = r;
        return <AdminLocalizedStatusBadge status={rowStatus} />;
      },
    },
    { key: "priority", header: a.t("admin.disputes.priority"), render: (r) => r.priority },
    {
      key: "updated",
      header: a.table.updated,
      render: (r) => formatAdminDate(r.updatedAt),
    },
  ];

  return (
    <AdminSectionShell sectionId="disputes" title={a.adminSectionLabel("disputes")}>
      <AdminSectionPanel>
        {summary ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            {[
              { label: a.t("admin.disputes.kpi.open"), value: summary.open },
              { label: a.t("admin.disputes.kpi.waitingAdmin"), value: summary.waitingAdmin },
              { label: a.t("admin.disputes.kpi.escalated"), value: summary.escalated },
              { label: a.t("admin.disputes.kpi.highPriority"), value: summary.highPriority },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <p className="text-xs text-neutral-500">{kpi.label}</p>
                <p className="text-2xl font-semibold text-neutral-900">{kpi.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Input
            className={ADMIN_SECTION_FILTERS}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={a.t("admin.disputes.searchPlaceholder")}
          />
          <AdminSectionRefreshButton onClick={() => load()} />
        </div>

        <AdminSectionTabBar
          tabs={DISPUTE_TABS.map((t) => ({ id: t.id, label: a.t(t.labelKey) }))}
          activeId={tab}
          onChange={(id) => setTab(id as DisputeTab)}
        />

        <AdminSectionDataArea>
          {loading ? <AdminLoadingState label={a.t("admin.loading.disputes")} /> : null}
          {error ? <AdminErrorState message={error} onRetry={() => load()} /> : null}
          {!loading && !error && filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">{a.t("admin.disputes.empty")}</p>
          ) : null}
          {!loading && !error && filtered.length > 0 ? (
            <AdminDataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              onRowClick={(r) => {
                setSelectedId(r.id);
                setDrawerOpen(true);
              }}
            />
          ) : null}
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
