"use client";

import * as React from "react";
import { ChevronDown, Plus } from "@/lib/lucide";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  AdminLegalPolicyDrawer,
  legalPolicyFormForNewVersion,
  type LegalPolicyFormBody,
} from "@/features/admin/components/admin-legal-policy-drawer";
import { AdminLegalPreviewDialog } from "@/features/admin/components/admin-legal-preview-dialog";
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
  AdminConfirmDialog,
  AdminDataTable,
  AdminErrorState,
  AdminLocalizedStatusBadge,
  AdminReadOnlyBanner,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  archiveAdminLegalPolicy,
  getAdminLegalPolicy,
  listAdminLegalPoliciesGrouped,
  publishAdminLegalPolicy,
  submitAdminLegalPolicyReview,
  type AdminLegalPolicyGroup,
  type AdminLegalPolicySummary,
} from "@/services/admin/adminLegal.service";
import { cn } from "@/lib/utils";

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

  const [groups, setGroups] = React.useState<AdminLegalPolicyGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(new Set());
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = React.useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit">("create");
  const [selectedPolicyId, setSelectedPolicyId] = React.useState<string | null>(null);
  const [createFormSeed, setCreateFormSeed] = React.useState<LegalPolicyFormBody | null>(null);
  const [createFormType, setCreateFormType] = React.useState<string | undefined>();

  const [confirmPublish, setConfirmPublish] = React.useState<AdminLegalPolicySummary | null>(null);
  const [confirmArchive, setConfirmArchive] = React.useState<AdminLegalPolicySummary | null>(null);
  const [previewPolicy, setPreviewPolicy] = React.useState<{
    title: string;
    version: string;
    content: string;
    contentFormat?: string;
  } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await listAdminLegalPoliciesGrouped(client));
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const stats = React.useMemo(
    () => ({
      types: groups.length,
      active: groups.filter((g) => g.activePolicy).length,
      drafts: groups.reduce(
        (acc, g) => acc + g.versions.filter((v) => v.status === "DRAFT" || v.status === "REVIEW").length,
        0,
      ),
    }),
    [groups],
  );

  function toggleExpanded(type: string) {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function openCreate(seed?: AdminLegalPolicySummary, type?: string) {
    setDrawerMode("create");
    setSelectedPolicyId(null);
    setCreateFormType(type);
    if (seed?.id) {
      try {
        const full = await getAdminLegalPolicy(client, seed.id);
        setCreateFormSeed(legalPolicyFormForNewVersion(full));
      } catch {
        setCreateFormSeed(null);
      }
    } else {
      setCreateFormSeed(null);
    }
    setDrawerOpen(true);
  }

  function openEdit(id: string) {
    setDrawerMode("edit");
    setSelectedPolicyId(id);
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

  const groupColumns: AdminColumn<AdminLegalPolicyGroup>[] = [
    {
      key: "type",
      header: a.table.type,
      render: (g) => (
        <button
          type="button"
          className="flex items-center gap-2 text-left font-medium text-zinc-100"
          onClick={() => toggleExpanded(g.type)}
        >
          <ChevronDown
            className={cn("size-4 text-zinc-500 transition", expandedTypes.has(g.type) && "rotate-180")}
            aria-hidden
          />
          {a.adminLegalPolicyTypeLabel(g.type)}
        </button>
      ),
    },
    {
      key: "active",
      header: "Активная версия",
      render: (g) =>
        g.activePolicy ? (
          <span className="font-mono text-xs text-emerald-300">v{g.activePolicy.version}</span>
        ) : (
          <span className="text-xs text-zinc-500">—</span>
        ),
    },
    {
      key: "versions",
      header: "Версий",
      render: (g) => <span className="tabular-nums text-zinc-300">{g.versionCount}</span>,
    },
    {
      key: "consent",
      header: a.t("admin.legal.requiresConsent"),
      render: (g) => (
        <span className={g.activePolicy?.requiresUserConsent ? "text-amber-300" : "text-zinc-500"}>
          {g.activePolicy?.requiresUserConsent ? a.t("admin.legal.required") : a.t("admin.legal.optional")}
        </span>
      ),
    },
    {
      key: "updated",
      header: a.table.updated,
      render: (g) => (
        <span className="text-xs tabular-nums text-zinc-500">
          {g.activePolicy ? formatAdminDate(g.activePolicy.updatedAt) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (g) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          {canMutate ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={adminBtnOutline}
              onClick={() => openCreate(g.activePolicy ?? g.latestDraft ?? g.versions[0], g.type)}
            >
              Новая версия
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={adminBtnOutline}
            onClick={() => toggleExpanded(g.type)}
          >
            История
          </Button>
        </div>
      ),
    },
  ];

  function renderVersionRow(v: AdminLegalPolicySummary, group: AdminLegalPolicyGroup) {
    const busy = actionBusyId === v.id;
    const editable = v.status === "DRAFT" || v.status === "REVIEW";
    const sourceForCopy = group.versions.find((x) => x.id === v.id) ?? v;

    return (
      <div
        key={v.id}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 px-4 py-3 text-sm"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-zinc-300">v{v.version}</span>
            <AdminLocalizedStatusBadge status={v.status} />
            {v.requiresUserConsent ? (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                Consent
              </span>
            ) : null}
          </div>
          <p className="truncate text-zinc-400">{v.title}</p>
          <p className="text-[11px] text-zinc-600">
            Обновлено {formatAdminDate(v.updatedAt)}
            {v.publishedAt ? ` · Опубликовано ${formatAdminDate(v.publishedAt)}` : ""}
            {v.consentsCount > 0 ? ` · Принятий: ${v.consentsCount}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={() => openEdit(v.id)}>
            {editable && canMutate ? "Редактировать" : "Просмотр"}
          </Button>
          {canMutate ? (
            <>
              {v.status === "DRAFT" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={adminBtnOutline}
                  disabled={busy}
                  onClick={() => void runRowAction(v.id, () => submitAdminLegalPolicyReview(client, v.id))}
                >
                  На проверку
                </Button>
              ) : null}
              {v.status !== "ACTIVE" ? (
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
                  disabled={busy}
                  onClick={() => setConfirmPublish(v)}
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
                  onClick={() => setConfirmArchive(v)}
                >
                  В архив
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={adminBtnOutline}
                disabled={busy}
                onClick={() => openCreate(sourceForCopy, group.type)}
              >
                Копия
              </Button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <AdminSectionShell
      sectionId="legal"
      title={a.adminSectionLabel("legal")}
      infoHint="Управление юридическими документами: черновики, проверка, публикация версий. ACTIVE-версии неизменяемы — создайте новую версию."
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
            <StatTile label="Типов документов" value={stats.types} tone="info" />
            <StatTile label="С активной версией" value={stats.active} tone="success" />
            <StatTile label="Черновики / review" value={stats.drafts} tone={stats.drafts > 0 ? "warning" : "neutral"} />
          </div>
        ) : null}

        {actionError ? <p className="text-sm text-rose-400">{actionError}</p> : null}

        <AdminSectionDataArea loading={loading} loadingLabel="Загрузка политик…">
          {error ? (
            <AdminErrorState message={error} onRetry={() => void load()} />
          ) : (
            <div className="space-y-3">
              <AdminDataTable
                flat
                borderless
                className="[&_table]:min-w-[960px]"
                columns={groupColumns}
                rows={groups}
                rowKey={(g) => g.type}
                emptyMessage="Юридических документов пока нет — создайте первую версию."
              />
              {groups.map((group) =>
                expandedTypes.has(group.type) ? (
                  <div key={`history-${group.type}`} className="rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                      <p className="text-sm font-medium text-zinc-200">
                        История: {a.adminLegalPolicyTypeLabel(group.type)}
                      </p>
                      <span className="text-xs text-zinc-500">{group.versionCount} версий</span>
                    </div>
                    {group.versions.map((v) => renderVersionRow(v, group))}
                  </div>
                ) : null,
              )}
            </div>
          )}
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminLegalPolicyDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        policyId={drawerMode === "edit" ? selectedPolicyId : null}
        initialForm={createFormSeed}
        initialType={createFormType}
        client={client}
        canMutate={canMutate}
        onSaved={load}
        onPreview={(payload) => setPreviewPolicy(payload)}
      />

      <AdminLegalPreviewDialog
        open={Boolean(previewPolicy)}
        onOpenChange={(open) => !open && setPreviewPolicy(null)}
        title={previewPolicy?.title ?? ""}
        version={previewPolicy?.version ?? ""}
        content={previewPolicy?.content ?? ""}
        contentFormat={previewPolicy?.contentFormat}
      />

      <AdminConfirmDialog
        open={Boolean(confirmPublish)}
        onOpenChange={(open) => !open && setConfirmPublish(null)}
        title="Опубликовать версию?"
        description={`Версия v${confirmPublish?.version ?? ""} станет ACTIVE. Текущая активная версия этого типа будет архивирована. Пользователям может потребоваться повторное согласие.`}
        confirmLabel="Опубликовать"
        confirming={actionBusyId === confirmPublish?.id}
        onConfirm={async () => {
          if (!confirmPublish) return;
          await runRowAction(confirmPublish.id, () => publishAdminLegalPolicy(client, confirmPublish.id));
          setConfirmPublish(null);
        }}
      />

      <AdminConfirmDialog
        open={Boolean(confirmArchive)}
        onOpenChange={(open) => !open && setConfirmArchive(null)}
        title="Архивировать версию?"
        description={`Версия v${confirmArchive?.version ?? ""} будет перенесена в архив.`}
        confirmLabel="В архив"
        variant="destructive"
        confirming={actionBusyId === confirmArchive?.id}
        onConfirm={async () => {
          if (!confirmArchive) return;
          await runRowAction(confirmArchive.id, () => archiveAdminLegalPolicy(client, confirmArchive.id));
          setConfirmArchive(null);
        }}
      />
    </AdminSectionShell>
  );
}
