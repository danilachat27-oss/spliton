"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardList } from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AdminListQuery } from "@/features/admin/api/types";
import type { AdminAuditListItem } from "@/features/admin/mocks/admin-audit.mock";
import {
  AdminCopyButton,
  AdminDataTable,
  AdminDetailDrawer,
  AdminFilterBar,
  AdminLocalizedStatusBadge,
  AdminPagination,
  AdminRoleBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { listAdminAuditPaginated } from "@/services/admin/adminAudit.service";
import { cn } from "@/lib/utils";

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "info" | "warning";
}) {
  const valueClass =
    tone === "info"
      ? "text-sky-800"
      : tone === "warning"
        ? "text-amber-800"
        : "text-zinc-100";
  return (
    <div className={cn(ADMIN_SECTION_TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-200">{children}</dd>
    </div>
  );
}

function JsonPreview({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-zinc-500">—</span>;
  }
  let formatted = value;
  try {
    formatted = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    /* keep raw */
  }
  return (
    <pre className="max-h-48 overflow-auto rounded-xl bg-zinc-900/50 p-3 font-mono text-xs leading-relaxed text-zinc-300">
      {formatted}
    </pre>
  );
}

function countByPredicate(rows: AdminAuditListItem[], predicate: (row: AdminAuditListItem) => boolean) {
  return rows.filter(predicate).length;
}

export function AuditSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const searchParams = useSearchParams();
  const loader = React.useCallback(
    (q: AdminListQuery) => listAdminAuditPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);
  const rows = page.items;

  const [search, setSearch] = React.useState(() => searchParams.get("search") ?? "");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [selected, setSelected] = React.useState<AdminAuditListItem | null>(null);

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }));
  }, [search, dateFrom, dateTo, setQuery]);

  const pageStats = React.useMemo(
    () => ({
      roles: countByPredicate(rows, (r) => r.action.includes("role")),
      finance: countByPredicate(
        rows,
        (r) =>
          r.entity === "withdrawal" ||
          r.entity === "deposit" ||
          r.entity === "wallet" ||
          r.action.includes("withdrawal") ||
          r.action.includes("deposit"),
      ),
      risk: countByPredicate(
        rows,
        (r) => r.action.startsWith("compliance.") || r.entity === "compliance",
      ),
    }),
    [rows],
  );

  const columns: AdminColumn<AdminAuditListItem>[] = [
    {
      key: "at",
      header: "Дата и время",
      render: (r) => (
        <span className="whitespace-nowrap tabular-nums text-zinc-300">{formatAdminDate(r.createdAt)}</span>
      ),
    },
    {
      key: "admin",
      header: a.table.admin,
      render: (r) => {
        const { role: adminRole } = r;
        return (
        <div>
          <p className="font-medium text-zinc-100">{r.adminEmail}</p>
          <AdminRoleBadge role={adminRole} className="mt-1" />
        </div>
        );
      },
    },
    {
      key: "action",
      header: a.table.action,
      render: (r) => (
        <span className="font-medium text-zinc-200">{a.formatAuditAction(r.action)}</span>
      ),
    },
    {
      key: "entity",
      header: a.table.entity,
      render: (r) => (
        <div>
          <p className="text-zinc-200">{a.formatAuditEntity(r.entity)}</p>
          <p className="font-mono text-xs text-zinc-500">{r.entityId}</p>
        </div>
      ),
    },
    {
      key: "result",
      header: a.table.result,
      render: () => <AdminLocalizedStatusBadge status="completed" tone="success" />,
    },
    {
      key: "ip",
      header: a.table.ip,
      render: (r) => <span className="font-mono text-xs text-zinc-400">{r.ip}</span>,
    },
  ];

  return (
    <AdminSectionShell
      sectionId="audit"
      title={a.adminSectionLabel("audit")}
      infoHint={
        <>
          Неизменяемый журнал действий операторов: финансовые операции, роли, риски и системные изменения. Каждая
          запись содержит состояние до и после, IP и браузер.
        </>
      }
      actions={<AdminSectionRefreshButton onClick={reload} />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={a.t("admin.kpi.audit.totalRecords")} value={loading ? "…" : String(page.total)} />
        <StatTile
          label={a.t("admin.kpi.audit.rolesOnPage")}
          value={loading ? "…" : String(pageStats.roles)}
          tone="info"
        />
        <StatTile
          label={a.t("admin.kpi.audit.financeOnPage")}
          value={loading ? "…" : String(pageStats.finance)}
        />
        <StatTile
          label={a.t("admin.kpi.audit.riskOnPage")}
          value={loading ? "…" : String(pageStats.risk)}
          tone="warning"
        />
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
              placeholder: "Действие, сотрудник, объект…",
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
          ]}
        />

        <AdminSectionDataArea
          loading={loading}
          error={error}
          onRetry={reload}
          loadingLabel="Загрузка журнала…"
        >
          <AdminDataTable
            flat
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={setSelected}
            emptyMessage={a.empty.noData}
          />
          <AdminPagination
            page={query.page ?? 1}
            pageSize={query.pageSize ?? 20}
            total={page.total}
            onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminDetailDrawer
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        title={a.t("admin.kpi.audit.recordTitle")}
        subtitle={selected?.id}
        wide
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/50 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white">
                <ClipboardList className="size-[18px]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-zinc-100">{a.formatAuditAction(selected.action)}</p>
                <p className="text-sm text-zinc-400">
                  {a.formatAuditEntity(selected.entity)} ·{" "}
                  <span className="font-mono text-xs">{selected.entityId}</span>
                </p>
                <p className="text-xs tabular-nums text-zinc-500">
                  {formatAdminDate(selected.createdAt)}
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label={a.table.admin}>{selected.adminEmail}</DetailField>
              <DetailField label={a.t("admin.field.role")}>
                <AdminRoleBadge role={selected.role} />
              </DetailField>
              <DetailField label={a.table.result}>
                <AdminLocalizedStatusBadge status="completed" tone="success" />
              </DetailField>
              <DetailField label={a.table.ip}>
                <span className="font-mono text-xs">{selected.ip}</span>
              </DetailField>
            </dl>

            <DetailField label={a.t("admin.field.recordId")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{selected.id}</span>
                <AdminCopyButton value={selected.id} label={a.t("admin.ui.copy")} />
              </div>
            </DetailField>

            <DetailField label={a.t("admin.field.before")}>
              <JsonPreview value={selected.before} />
            </DetailField>
            <DetailField label={a.t("admin.field.after")}>
              <JsonPreview value={selected.after} />
            </DetailField>

            <DetailField label={a.t("admin.field.browser")}>
              <p className="break-all text-xs leading-relaxed text-zinc-400">{selected.userAgent}</p>
            </DetailField>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </AdminSectionShell>
  );
}
