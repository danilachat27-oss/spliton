"use client";

import * as React from "react";

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
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_FILTERS } from "@/features/admin/lib/admin-section-styles";
import type { AdminTicketListItem } from "@/features/admin/mocks/admin-support.mock";
import {
  AdminDataTable,
  AdminLocalizedStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminSupportTicketDrawer } from "@/features/admin/sections/admin-support-ticket-drawer";
import { getAdminSupportSummary, listAdminTickets } from "@/services/admin/adminSupport.service";

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
    { key: "id", header: a.table.ticket, render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "user", header: a.table.user, render: (r) => r.userEmail },
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
        const { status: rowStatus } = r;
        return <AdminLocalizedStatusBadge status={rowStatus} />;
      },
    },
    { key: "assigned", header: a.table.assigned, render: (r) => r.assignedTo ?? "—" },
    {
      key: "updated",
      header: a.table.updated,
      render: (r) => <span className="text-xs text-zinc-500">{formatAdminDate(r.updatedAt)}</span>,
    },
  ];

  return (
    <AdminSectionShell sectionId="support" title={a.adminSectionLabel("support")}>
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Открытые", value: summary.open },
            { label: "В работе", value: summary.inProgress },
            { label: "Эскалированы", value: summary.escalated },
            { label: a.t("admin.support.highCritical"), value: summary.highPriorityOpen },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-neutral-200/80 bg-zinc-900/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{k.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <AdminSectionPanel>
        <AdminSectionTabBar
          tabs={SUPPORT_TABS.map((t) => ({ ...t, count: tabCounts[t.id] }))}
          activeId={tab}
          onChange={(id) => setTab(id as SupportTab)}
        />

        <div className={ADMIN_SECTION_FILTERS}>
          <div className="sm:col-span-2">
            <label htmlFor="support-search" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Поиск
            </label>
            <Input
              id="support-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={a.t("admin.placeholder.supportSearch")}
              className="h-10 rounded-xl border-neutral-200 bg-zinc-900/80"
            />
          </div>
          <div className="flex items-end justify-between gap-2 sm:col-span-2">
            <p className="text-xs text-zinc-500">
              Показано: <span className="font-semibold tabular-nums text-zinc-200">{filtered.length}</span>
            </p>
            <AdminSectionRefreshButton onClick={load} />
          </div>
        </div>

        <AdminSectionDataArea loading={loading} error={error} onRetry={load} loadingLabel="Загрузка тикетов…">
          <AdminDataTable
            flat
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
