"use client";

import * as React from "react";

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
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AdminTicketListItem } from "@/features/admin/mocks/admin-support.mock";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminFilterResultCount,
  AdminLocalizedStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminSupportTicketDrawer } from "@/features/admin/sections/admin-support-ticket-drawer";
import { getAdminSupportSummary, listAdminTickets } from "@/services/admin/adminSupport.service";
import { cn } from "@/lib/utils";

const SUPPORT_TABS = [
  { id: "all", label: "Все" },
  { id: "open", label: "Открытые" },
  { id: "in_progress", label: "В работе" },
  { id: "waiting_user", label: "Ожидают пользователя" },
  { id: "escalated", label: "Эскалированы" },
  { id: "closed", label: "Закрытые" },
] as const;

type SupportTab = (typeof SUPPORT_TABS)[number]["id"];

const CATEGORY_LABELS: Record<string, string> = {
  deposit: "Пополнение",
  withdrawal: "Вывод",
  account: "Аккаунт",
  market: "Вторичный рынок",
  payout: "Начисления",
  technical: "Техническая проблема",
  other: "Другое",
};

const adminTableLink =
  "text-sm font-medium text-zinc-100 transition-colors hover:text-[#B7F500]";

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

export function SupportSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [tab, setTab] = useAdminSectionTab<SupportTab>(
    SUPPORT_TABS.map((t) => t.id),
    "all",
  );
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<AdminTicketListItem | null>(null);
  const [rows, setRows] = React.useState<AdminTicketListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [summary, setSummary] = React.useState<{
    open: number;
    inProgress: number;
    escalated: number;
    highPriorityOpen: number;
  } | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([listAdminTickets(client), getAdminSupportSummary(client)])
      .then(([tickets, s]) => {
        setRows(tickets);
        setSummary(s);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.id.toLowerCase().includes(q) ||
      t.userEmail.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  const tabCounts = React.useMemo(() => {
    const counts: Record<SupportTab, number> = {
      all: rows.length,
      open: 0,
      in_progress: 0,
      waiting_user: 0,
      escalated: 0,
      closed: 0,
    };
    for (const r of rows) {
      if (r.status in counts) counts[r.status as SupportTab] += 1;
    }
    return counts;
  }, [rows]);

  const columns: AdminColumn<AdminTicketListItem>[] = [
    {
      key: "id",
      header: a.table.ticket,
      render: (r) => <span className="font-mono text-xs text-zinc-300">{r.id}</span>,
    },
    {
      key: "user",
      header: a.table.user,
      render: (r) => <span className={adminTableLink}>{r.userEmail}</span>,
    },
    { key: "subject", header: a.table.subject, render: (r) => r.subject },
    {
      key: "cat",
      header: a.table.category,
      render: (r) => CATEGORY_LABELS[r.category] ?? r.category,
    },
    {
      key: "pri",
      header: a.table.priority,
      render: (r) => (
        <AdminLocalizedStatusBadge
          status={r.priority}
          tone={r.priority === "high" ? "danger" : "neutral"}
        />
      ),
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => {
        const rowStatus = r.status;
        return <AdminLocalizedStatusBadge status={rowStatus} />;
      },
    },
    {
      key: "assigned",
      header: a.table.assigned,
      render: (r) =>
        r.assignedTo ? (
          <span className="text-sm text-zinc-200">{r.assignedTo}</span>
        ) : (
          <span className="text-sm text-zinc-500">Не назначен</span>
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
      sectionId="support"
      title={a.adminSectionLabel("support")}
      infoHint="Очередь обращений пользователей: статусы, приоритеты, назначение оператора и история переписки."
      actions={<AdminSectionRefreshButton onClick={load} />}
    >
      <AdminSectionPanel>
        {summary && !loading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            <StatTile label={a.t("admin.support.stats.open")} value={summary.open} tone="info" />
            <StatTile label={a.t("admin.support.stats.inProgress")} value={summary.inProgress} tone="warning" />
            <StatTile
              label={a.t("admin.support.stats.escalated")}
              value={summary.escalated}
              tone={summary.escalated > 0 ? "danger" : "neutral"}
            />
            <StatTile
              label={a.t("admin.support.highCritical")}
              value={summary.highPriorityOpen}
              tone={summary.highPriorityOpen > 0 ? "danger" : "neutral"}
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
          searchHint="Поиск по номеру тикета, email пользователя и теме обращения."
          footer={
            <AdminFilterResultCount label={a.t("admin.filters.foundCount")} value={filtered.length} className="w-full" />
          }
          fields={[
            {
              id: "search",
              label: "Поиск",
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: a.t("admin.placeholder.supportSearch"),
            },
          ]}
        />

        <AdminSectionTabBar
          tabs={SUPPORT_TABS.map((t) => ({ ...t, count: tabCounts[t.id] }))}
          activeId={tab}
          onChange={(id) => setTab(id as SupportTab)}
        />

        <AdminSectionDataArea loading={loading} error={error} onRetry={load} loadingLabel="Загрузка тикетов…">
          <AdminDataTable
            flat
            borderless
            className="[&_table]:min-w-[960px]"
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            onRowClick={setSelected}
            emptyMessage="Нет обращений по выбранным фильтрам"
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminSupportTicketDrawer
        ticketId={selected?.id ?? null}
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        onUpdated={load}
      />
    </AdminSectionShell>
  );
}
