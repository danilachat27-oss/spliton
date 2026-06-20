"use client";

import * as React from "react";
import { Plus } from "@/lib/lucide";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  AdminLegalPolicyDrawer,
  legalPolicyFormForNewVersion,
  type LegalPolicyFormBody,
} from "@/features/admin/components/admin-legal-policy-drawer";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { canMatrixAction } from "@/features/admin/config/admin-role-matrix";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminBtnOutline, adminSectionCreateButton, adminSectionToolbarActions } from "@/features/admin/lib/admin-ui";
import {
  AdminDataTable,
  AdminErrorState,
  AdminFilterPills,
  AdminFilterResultCount,
  AdminLocalizedStatusBadge,
  AdminReadOnlyBanner,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  archiveAdminLegalPolicy,
  listAdminLegalPolicies,
  publishAdminLegalPolicy,
  type AdminLegalPolicyRow,
} from "@/services/admin/adminLegal.service";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "DRAFT" | "REVIEW" | "ACTIVE" | "ARCHIVED";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "DRAFT", label: "Черновики" },
  { value: "REVIEW", label: "На проверке" },
  { value: "ACTIVE", label: "Активные" },
  { value: "ARCHIVED", label: "В архиве" },
];

const legalTableClass = "[&_table]:min-w-[960px]";

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

export function AdminLegalSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const canMutate = canMatrixAction(user?.roles, "legal", "mutate");
  const readOnly = !canMutate;

  const [rows, setRows] = React.useState<AdminLegalPolicyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = React.useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit">("create");
  const [selectedPolicy, setSelectedPolicy] = React.useState<AdminLegalPolicyRow | null>(null);
  const [createFormSeed, setCreateFormSeed] = React.useState<LegalPolicyFormBody | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAdminLegalPolicies(client));
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const stats = React.useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === "ACTIVE").length,
      drafts: rows.filter((r) => r.status === "DRAFT" || r.status === "REVIEW").length,
    }),
    [rows],
  );

  function openCreate(seed?: AdminLegalPolicyRow) {
    setDrawerMode("create");
    setSelectedPolicy(null);
    setCreateFormSeed(seed ? legalPolicyFormForNewVersion(seed) : null);
    setDrawerOpen(true);
  }

  function openEdit(row: AdminLegalPolicyRow) {
    setDrawerMode("edit");
    setSelectedPolicy(row);
    setCreateFormSeed(null);
    setDrawerOpen(true);
  }

  async function runRowAction(id: string, action: () => Promise<unknown>) {
    setActionBusyId(id);
    setActionError(null);
    try {
      await action();
      await load();
    } catch (e) {
      setActionError(localizedAdminError(e));
    } finally {
      setActionBusyId(null);
    }
  }

  const columns: AdminColumn<AdminLegalPolicyRow>[] = [
    { key: "type", header: a.table.type, render: (r) => a.adminLegalPolicyTypeLabel(r.type) },
    { key: "version", header: "Версия", render: (r) => <span className="font-mono text-xs text-zinc-300">{r.version}</span> },
    { key: "title", header: a.table.name, render: (r) => r.title },
    {
      key: "st",
      header: a.table.status,
      render: (policyRow) => <AdminLocalizedStatusBadge status={policyRow.status} />,
    },
    {
      key: "consent",
      header: a.t("admin.legal.requiresConsent"),
      render: (r) => (
        <span className={r.requiresUserConsent ? "text-amber-300" : "text-zinc-500"}>
          {r.requiresUserConsent ? a.t("admin.legal.required") : a.t("admin.legal.optional")}
        </span>
      ),
    },
    {
      key: "updated",
      header: a.table.updated,
      render: (r) => <span className="text-xs tabular-nums text-zinc-500">{formatAdminDate(r.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => {
        const busy = actionBusyId === r.id;
        const editable = r.status === "DRAFT" || r.status === "REVIEW";
        return (
          <div className="flex flex-wrap justify-end gap-1.5">
            {canMutate ? (
              <>
                {editable ? (
                  <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={() => openEdit(r)}>
                    Редактировать
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={adminBtnOutline}
                  disabled={busy}
                  onClick={() => openCreate(r)}
                >
                  Новая версия
                </Button>
                {r.status !== "ACTIVE" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
                    disabled={busy}
                    onClick={() => void runRowAction(r.id, () => publishAdminLegalPolicy(client, r.id))}
                  >
                    Опубликовать
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={adminBtnOutline}
                    disabled={busy}
                    onClick={() => void runRowAction(r.id, () => archiveAdminLegalPolicy(client, r.id))}
                  >
                    В архив
                  </Button>
                )}
              </>
            ) : (
              <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={() => openEdit(r)}>
                Просмотр
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AdminSectionShell
      sectionId="legal"
      title={a.adminSectionLabel("legal")}
      infoHint="Управление юридическими документами Spliton: черновики, публикация версий и требование согласия пользователей."
      actions={
        <div className={adminSectionToolbarActions}>
          <AdminSectionRefreshButton onClick={() => void load()} loading={loading} />
          {canMutate ? (
            <Button type="button" size="sm" className={adminSectionCreateButton} onClick={() => openCreate()}>
              <Plus className="size-3.5" aria-hidden />
              Новая политика
            </Button>
          ) : null}
        </div>
      }
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("legal")} /> : null}

      <AdminSectionPanel className="min-w-0">
        {!loading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            <StatTile label="Всего версий" value={stats.total} tone="info" />
            <StatTile label="Активные" value={stats.active} tone="success" />
            <StatTile
              label="Черновики"
              value={stats.drafts}
              tone={stats.drafts > 0 ? "warning" : "neutral"}
            />
          </div>
        ) : (
          <div className={ADMIN_SECTION_KPI_GRID}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(ADMIN_SECTION_TILE, "h-24 animate-pulse bg-zinc-800/50")} />
            ))}
          </div>
        )}

        <div className="space-y-3">
          <AdminFilterPills
            label={a.table.status}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            options={STATUS_FILTERS}
          />
          <AdminFilterResultCount label={a.t("admin.filters.foundCount")} value={filtered.length} />
        </div>

        {actionError ? <p className="text-sm text-rose-400">{actionError}</p> : null}

        <AdminSectionDataArea loading={loading} loadingLabel="Загрузка политик…">
          {error ? (
            <AdminErrorState message={error} onRetry={() => void load()} />
          ) : (
            <AdminDataTable
              flat
              borderless
              className={legalTableClass}
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              onRowClick={openEdit}
              emptyMessage="Юридических документов пока нет — создайте первую версию."
            />
          )}
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminLegalPolicyDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        policy={drawerMode === "edit" ? selectedPolicy : null}
        initialForm={createFormSeed}
        client={client}
        canMutate={canMutate}
        onSaved={load}
      />
    </AdminSectionShell>
  );
}
