"use client";

import * as React from "react";
import { Plus } from "@/lib/lucide";

import {
  AdminDrawerCancelButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminDrawerUnsavedGuard } from "@/features/admin/hooks/use-admin-drawer-unsaved-guard";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import {
  AdminDataTable,
  AdminDetailDrawer,
  AdminFilterBar,
  AdminFormField,
  AdminFormFooter,
  AdminReadOnlyBanner,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  createAdminLabel,
  listAdminLabels,
  updateAdminLabel,
  type AdminLabelListItem,
} from "@/services/admin/adminLabels.service";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { cn } from "@/lib/utils";

export function LabelsSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const readOnly = perms.readOnly("Tracks");

  const [rows, setRows] = React.useState<AdminLabelListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<AdminLabelListItem | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [baseline, setBaseline] = React.useState({ name: "", slug: "" });
  const [saving, setSaving] = React.useState(false);

  const dirty =
    drawerOpen &&
    (name !== baseline.name || slug !== baseline.slug) &&
    !saving;
  const { guardedOnOpenChange, UnsavedChangesDialog } = useAdminDrawerUnsavedGuard({
    open: drawerOpen,
    dirty,
    onOpenChange: setDrawerOpen,
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void listAdminLabels(search || undefined, client)
      .then(setRows)
      .catch((e) => setError(localizedAdminError(e)))
      .finally(() => setLoading(false));
  }, [client, search]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditRow(null);
    setName("");
    setSlug("");
    setBaseline({ name: "", slug: "" });
    setDrawerOpen(true);
  }

  function openEdit(row: AdminLabelListItem) {
    setEditRow(row);
    setName(row.name);
    setSlug(row.slug);
    setBaseline({ name: row.name, slug: row.slug });
    setDrawerOpen(true);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editRow) {
        await updateAdminLabel(
          editRow.id,
          { name: name.trim(), slug: slug.trim() || undefined },
          client,
        );
        setFeedback("Изменения сохранены");
      } else {
        await createAdminLabel({ name: name.trim(), slug: slug.trim() || undefined }, client);
        setFeedback("Лейбл создан");
      }
      setDrawerOpen(false);
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: AdminLabelListItem) {
    if (readOnly) return;
    try {
      await updateAdminLabel(row.id, { isActive: !row.isActive }, client);
      setFeedback(row.isActive ? "Лейбл деактивирован" : "Лейбл восстановлен");
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  const columns: AdminColumn<AdminLabelListItem>[] = [
    {
      key: "name",
      header: "Название",
      render: (r) => (
        <span className={cn(!r.isActive && "text-zinc-500 line-through")}>{r.name}</span>
      ),
    },
    { key: "slug", header: "Slug", render: (r) => <span className="font-mono text-xs">{r.slug}</span> },
    { key: "releases", header: "Релизов", render: (r) => <span className="tabular-nums">{r.releaseCount}</span> },
    {
      key: "status",
      header: "Статус",
      render: (r) => (
        <span className={cn("text-xs", r.isActive ? "text-emerald-400" : "text-zinc-500")}>
          {r.isActive ? "Активен" : "Неактивен"}
        </span>
      ),
    },
    { key: "created", header: "Создан", render: (r) => formatAdminDate(r.createdAt) },
  ];

  return (
    <AdminSectionShell sectionId="labels" title={a.adminSectionLabel("labels")}>
      {readOnly ? <AdminReadOnlyBanner area="Tracks" /> : null}
      {feedback ? (
        <p className="rounded-xl border border-[#B7F500]/30 bg-[#B7F500]/10 px-4 py-2 text-sm text-[#B7F500]">
          {feedback}
        </p>
      ) : null}

      <AdminSectionPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminFilterBar
            fields={[
              {
                id: "search",
                label: "Поиск",
                type: "search",
                value: search,
                onChange: setSearch,
                placeholder: "Поиск по названию…",
              },
            ]}
          />
          <div className="flex gap-2">
            <AdminSectionRefreshButton onClick={load} />
            {!readOnly ? (
              <Button
                type="button"
                size="sm"
                className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
                onClick={openCreate}
              >
                <Plus className="mr-1 size-4" />
                Добавить лейбл
              </Button>
            ) : null}
          </div>
        </div>

        <AdminSectionDataArea loading={loading} error={error ? true : undefined} onRetry={load}>
          {error ? (
            <p className="mb-3 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
          ) : null}
          <AdminDataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={openEdit}
            emptyMessage="Лейблы не найдены"
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminDetailDrawer
        open={drawerOpen}
        onOpenChange={guardedOnOpenChange}
        title={editRow ? "Редактировать лейбл" : "Добавить лейбл"}
        footer={
          readOnly ? null : (
            <AdminFormFooter
              left={
                editRow ? (
                  <AdminDrawerSecondaryButton onClick={() => void toggleActive(editRow)}>
                    {editRow.isActive ? "Деактивировать" : "Восстановить"}
                  </AdminDrawerSecondaryButton>
                ) : undefined
              }
              right={
                <>
                  <AdminDrawerCancelButton onClick={() => guardedOnOpenChange(false)}>
                    {a.t("admin.actions.cancel")}
                  </AdminDrawerCancelButton>
                  <AdminDrawerPrimaryButton disabled={saving} onClick={() => void save()}>
                    {saving ? a.t("admin.drawer.common.saving") : a.t("admin.actions.confirm")}
                  </AdminDrawerPrimaryButton>
                </>
              }
            />
          )
        }
      >
        <div className="space-y-4">
          <AdminFormField label={a.t("admin.labels.fieldName")} htmlFor="label-name">
            <Input
              id="label-name"
              className={adminFieldInput}
              value={name}
              readOnly={readOnly}
              onChange={(e) => setName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Slug (URL)" htmlFor="label-slug">
            <Input
              id="label-slug"
              className={cn("font-mono text-sm", adminFieldInput)}
              value={slug}
              readOnly={readOnly}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="label-slug"
            />
          </AdminFormField>
        </div>
      </AdminDetailDrawer>
      {UnsavedChangesDialog}
    </AdminSectionShell>
  );
}
