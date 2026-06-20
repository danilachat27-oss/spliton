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
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
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
  createAdminReleaseGenre,
  listAdminReleaseGenres,
  updateAdminReleaseGenre,
  type AdminReleaseGenreListItem,
} from "@/services/admin/adminReleaseGenres.service";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { cn } from "@/lib/utils";

export function GenresSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const readOnly = perms.readOnly("Tracks");

  const [rows, setRows] = React.useState<AdminReleaseGenreListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<AdminReleaseGenreListItem | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [baseline, setBaseline] = React.useState({ name: "", slug: "" });
  const [saving, setSaving] = React.useState(false);

  const dirty =
    drawerOpen && (name !== baseline.name || slug !== baseline.slug) && !saving;
  const { guardedOnOpenChange, UnsavedChangesDialog } = useAdminDrawerUnsavedGuard({
    open: drawerOpen,
    dirty,
    onOpenChange: setDrawerOpen,
  });

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void listAdminReleaseGenres(search || undefined, client)
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

  function openEdit(row: AdminReleaseGenreListItem) {
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
        await updateAdminReleaseGenre(
          editRow.id,
          { name: name.trim(), slug: slug.trim() || undefined },
          client,
        );
        setFeedback(a.t("admin.genres.saved"));
      } else {
        await createAdminReleaseGenre({ name: name.trim(), slug: slug.trim() || undefined }, client);
        setFeedback(a.t("admin.genres.created"));
      }
      setDrawerOpen(false);
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: AdminReleaseGenreListItem) {
    if (readOnly) return;
    try {
      await updateAdminReleaseGenre(row.id, { isActive: !row.isActive }, client);
      setFeedback(row.isActive ? a.t("admin.genres.deactivated") : a.t("admin.genres.reactivated"));
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  const columns: AdminColumn<AdminReleaseGenreListItem>[] = [
    {
      key: "name",
      header: a.t("admin.genres.col.name"),
      render: (r) => (
        <span className={cn(!r.isActive && "text-zinc-500 line-through")}>{r.name}</span>
      ),
    },
    {
      key: "slug",
      header: a.t("admin.genres.col.slug"),
      render: (r) => <span className="font-mono text-xs">{r.slug}</span>,
    },
    {
      key: "releases",
      header: a.t("admin.genres.col.releases"),
      render: (r) => <span className="tabular-nums">{r.releaseCount}</span>,
    },
    {
      key: "status",
      header: a.t("admin.genres.col.status"),
      render: (r) => (
        <span className={cn("text-xs", r.isActive ? "text-emerald-400" : "text-zinc-500")}>
          {r.isActive ? a.t("admin.genres.active") : a.t("admin.genres.inactive")}
        </span>
      ),
    },
    {
      key: "created",
      header: a.t("admin.genres.col.created"),
      render: (r) => formatAdminDate(r.createdAt),
    },
  ];

  return (
    <AdminSectionShell sectionId="genres" title={a.adminSectionLabel("genres")}>
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
                label: a.t("admin.genres.search"),
                type: "search",
                value: search,
                onChange: setSearch,
                placeholder: a.t("admin.genres.search"),
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
                {a.t("admin.genres.create")}
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
            emptyMessage={a.t("admin.genres.empty")}
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminDetailDrawer
        open={drawerOpen}
        onOpenChange={guardedOnOpenChange}
        title={editRow ? a.t("admin.genres.edit") : a.t("admin.genres.create")}
        footer={
          readOnly ? null : (
            <AdminFormFooter
              left={
                editRow ? (
                  <AdminDrawerSecondaryButton onClick={() => void toggleActive(editRow)}>
                    {editRow.isActive ? a.t("admin.genres.deactivate") : a.t("admin.genres.reactivate")}
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
          <AdminFormField label={a.t("admin.genres.field.name")} htmlFor="genre-name">
            <Input
              id="genre-name"
              className={adminFieldInput}
              value={name}
              readOnly={readOnly}
              onChange={(e) => setName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label={a.t("admin.genres.field.slug")} htmlFor="genre-slug">
            <Input
              id="genre-slug"
              className={cn("font-mono text-sm", adminFieldInput)}
              value={slug}
              readOnly={readOnly}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="electronic"
            />
          </AdminFormField>
          {editRow ? (
            <p className="text-xs text-zinc-500">
              {a.t("admin.genres.releaseCount").replace("{n}", String(editRow.releaseCount))}
            </p>
          ) : null}
        </div>
      </AdminDetailDrawer>
      {UnsavedChangesDialog}
    </AdminSectionShell>
  );
}
