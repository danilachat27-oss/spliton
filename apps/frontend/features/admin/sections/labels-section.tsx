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
import { adminFieldInput, adminSectionCreateButton, adminSectionToolbarActions } from "@/features/admin/lib/admin-ui";
import { AdminLabelPlatformSearch } from "@/features/admin/components/admin-label-platform-search";
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
  AdminFilterPills,
  AdminFilterResultCount,
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
  const [status, setStatus] = React.useState("all");
  const [releases, setReleases] = React.useState("all");
  const [sort, setSort] = React.useState("name_asc");
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

  const listQuery = React.useMemo(
    () => ({ search, status, releases, sort }),
    [search, status, releases, sort],
  );

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void listAdminLabels(listQuery, client)
      .then(setRows)
      .catch((e) => setError(localizedAdminError(e)))
      .finally(() => setLoading(false));
  }, [client, listQuery]);

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
        setFeedback(a.t("admin.labels.saved"));
      } else {
        await createAdminLabel({ name: name.trim(), slug: slug.trim() || undefined }, client);
        setFeedback(a.t("admin.labels.created"));
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
      setFeedback(row.isActive ? a.t("admin.labels.deactivated") : a.t("admin.labels.reactivated"));
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  const columns: AdminColumn<AdminLabelListItem>[] = [
    {
      key: "name",
      header: a.t("admin.labels.col.name"),
      render: (r) => (
        <span className={cn(!r.isActive && "text-zinc-500 line-through")}>{r.name}</span>
      ),
    },
    {
      key: "slug",
      header: a.t("admin.labels.col.slug"),
      render: (r) => <span className="font-mono text-xs text-zinc-400">{r.slug}</span>,
    },
    {
      key: "releases",
      header: a.t("admin.labels.col.releases"),
      render: (r) => <span className="tabular-nums">{r.releaseCount}</span>,
    },
    {
      key: "status",
      header: a.t("admin.labels.col.status"),
      render: (r) => (
        <span className={cn("text-xs", r.isActive ? "text-emerald-400" : "text-zinc-500")}>
          {r.isActive ? a.t("admin.labels.active") : a.t("admin.labels.inactive")}
        </span>
      ),
    },
    {
      key: "created",
      header: a.t("admin.labels.col.created"),
      render: (r) => formatAdminDate(r.createdAt),
    },
  ];

  return (
    <AdminSectionShell
      sectionId="labels"
      title={a.adminSectionLabel("labels")}
      actions={
        <div className={adminSectionToolbarActions}>
          <AdminSectionRefreshButton onClick={load} />
          {!readOnly ? (
            <Button type="button" size="sm" className={adminSectionCreateButton} onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden />
              {a.t("admin.labels.create")}
            </Button>
          ) : null}
        </div>
      }
    >
      {readOnly ? <AdminReadOnlyBanner area="Tracks" /> : null}
      {feedback ? (
        <p className="rounded-xl border border-[#B7F500]/30 bg-[#B7F500]/10 px-4 py-2 text-sm text-[#B7F500]">
          {feedback}
        </p>
      ) : null}

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          panelWidthClassName="w-[min(100vw-1rem,520px)]"
          searchHint={a.t("admin.labels.searchHint")}
          footer={
            <AdminFilterResultCount
              label={a.t("admin.filters.foundCount")}
              value={rows.length}
              className="w-full"
            />
          }
          fields={[
            {
              id: "label-search",
              label: a.t("admin.labels.search"),
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: a.t("admin.labels.searchPlaceholder"),
            },
            {
              id: "label-status",
              label: a.t("admin.labels.filter.status"),
              type: "select",
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: a.actions.allStatuses },
                { value: "active", label: a.t("admin.labels.active") },
                { value: "inactive", label: a.t("admin.labels.inactive") },
              ],
            },
            {
              id: "label-releases",
              label: a.t("admin.labels.filter.releases"),
              type: "select",
              value: releases,
              onChange: setReleases,
              options: [
                { value: "all", label: a.t("admin.labels.filter.releases.all") },
                { value: "with", label: a.t("admin.labels.filter.releases.with") },
                { value: "without", label: a.t("admin.labels.filter.releases.without") },
              ],
            },
            {
              id: "label-sort",
              label: a.t("admin.labels.filter.sort"),
              type: "select",
              value: sort,
              onChange: setSort,
              options: [
                { value: "name_asc", label: a.t("admin.labels.filter.sort.nameAsc") },
                { value: "name_desc", label: a.t("admin.labels.filter.sort.nameDesc") },
                { value: "created_desc", label: a.t("admin.labels.filter.sort.createdDesc") },
                { value: "releases_desc", label: a.t("admin.labels.filter.sort.releasesDesc") },
              ],
            },
          ]}
        />

        <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900/25 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
          <AdminFilterPills
            label={a.t("admin.labels.filter.status")}
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: a.actions.allStatuses },
              { value: "active", label: a.t("admin.labels.active") },
              { value: "inactive", label: a.t("admin.labels.inactive") },
            ]}
          />
          <AdminFilterPills
            label={a.t("admin.labels.filter.releases")}
            value={releases}
            onChange={setReleases}
            options={[
              { value: "all", label: a.t("admin.labels.filter.releases.all") },
              { value: "with", label: a.t("admin.labels.filter.releases.with") },
              { value: "without", label: a.t("admin.labels.filter.releases.without") },
            ]}
          />
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
            emptyMessage={a.t("admin.labels.empty")}
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminDetailDrawer
        open={drawerOpen}
        onOpenChange={guardedOnOpenChange}
        title={editRow ? a.t("admin.labels.edit") : a.t("admin.labels.create")}
        footer={
          readOnly ? null : (
            <AdminFormFooter
              left={
                editRow ? (
                  <AdminDrawerSecondaryButton onClick={() => void toggleActive(editRow)}>
                    {editRow.isActive ? a.t("admin.labels.deactivate") : a.t("admin.labels.reactivate")}
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
          <AdminLabelPlatformSearch labelName={name} />
          <AdminFormField label={a.t("admin.labels.field.slug")} htmlFor="label-slug">
            <Input
              id="label-slug"
              className={cn("font-mono text-sm", adminFieldInput)}
              value={slug}
              readOnly={readOnly}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="label-slug"
            />
          </AdminFormField>
          {editRow ? (
            <p className="text-xs text-zinc-500">
              {a.t("admin.labels.releaseCount").replace("{n}", String(editRow.releaseCount))}
            </p>
          ) : null}
        </div>
      </AdminDetailDrawer>
      {UnsavedChangesDialog}
    </AdminSectionShell>
  );
}
