"use client";

import * as React from "react";
import { Plus } from "@/lib/lucide";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
  AdminDrawerPrimaryButton,
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
  AdminConfirmDialog,
  AdminDataTable,
  AdminDetailDrawer,
  AdminFilterBar,
  AdminFormField,
  AdminFormFooter,
  AdminReadOnlyBanner,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  createAdminArtist,
  deleteAdminArtist,
  listAdminArtists,
  updateAdminArtist,
  type AdminArtistListItem,
} from "@/services/admin/adminArtists.service";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { cn } from "@/lib/utils";

export function ArtistsSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const readOnly = perms.readOnly("Tracks");

  const [rows, setRows] = React.useState<AdminArtistListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<AdminArtistListItem | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [baseline, setBaseline] = React.useState({ name: "", slug: "" });
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminArtistListItem | null>(null);

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
    void listAdminArtists(search || undefined, client)
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

  function openEdit(row: AdminArtistListItem) {
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
        await updateAdminArtist(editRow.id, { name: name.trim(), slug: slug.trim() || undefined }, client);
        setFeedback(a.t("admin.artists.saved"));
      } else {
        await createAdminArtist({ name: name.trim(), slug: slug.trim() || undefined }, client);
        setFeedback(a.t("admin.artists.created"));
      }
      setDrawerOpen(false);
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteAdminArtist(deleteTarget.id, client);
      setFeedback(a.t("admin.artists.deleted"));
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  const columns: AdminColumn<AdminArtistListItem>[] = [
    { key: "name", header: a.t("admin.artists.col.name"), render: (r) => r.name },
    { key: "slug", header: a.t("admin.artists.col.slug"), render: (r) => <span className="font-mono text-xs">{r.slug}</span> },
    {
      key: "releases",
      header: a.t("admin.artists.col.releases"),
      render: (r) => <span className="tabular-nums">{r.releaseCount}</span>,
    },
    {
      key: "created",
      header: a.t("admin.artists.col.created"),
      render: (r) => formatAdminDate(r.createdAt),
    },
  ];

  return (
    <AdminSectionShell sectionId="artists" title={a.adminSectionLabel("artists")}>
      {readOnly ? <AdminReadOnlyBanner area="Tracks" /> : null}
      {feedback ? (
        <p className="rounded-xl border border-[#B7F500]/30 bg-[#B7F500]/10 px-4 py-2 text-sm text-[#B7F500]">{feedback}</p>
      ) : null}

      <AdminSectionPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminFilterBar
            fields={[
              {
                id: "search",
                label: a.t("admin.artists.search"),
                type: "search",
                value: search,
                onChange: setSearch,
                placeholder: a.t("admin.artists.search"),
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
                {a.t("admin.artists.create")}
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
            emptyMessage={a.t("admin.artists.empty")}
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminDetailDrawer
        open={drawerOpen}
        onOpenChange={guardedOnOpenChange}
        title={editRow ? a.t("admin.artists.edit") : a.t("admin.artists.create")}
        footer={
          readOnly ? null : (
            <AdminFormFooter
              left={
                editRow && editRow.releaseCount === 0 ? (
                  <AdminDrawerDangerButton onClick={() => setDeleteTarget(editRow)}>
                    {a.t("admin.artists.delete")}
                  </AdminDrawerDangerButton>
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
          <AdminFormField label={a.t("admin.artists.field.name")} htmlFor="artist-name">
            <Input
              id="artist-name"
              className={adminFieldInput}
              value={name}
              readOnly={readOnly}
              onChange={(e) => setName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label={a.t("admin.artists.field.slug")} htmlFor="artist-slug">
            <Input
              id="artist-slug"
              className={cn("font-mono text-sm", adminFieldInput)}
              value={slug}
              readOnly={readOnly}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="artist-slug"
            />
          </AdminFormField>
          {editRow ? (
            <p className="text-xs text-zinc-500">
              {a.t("admin.artists.releaseCount").replace("{n}", String(editRow.releaseCount))}
            </p>
          ) : null}
        </div>
      </AdminDetailDrawer>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={a.t("admin.artists.deleteTitle")}
        description={a.t("admin.artists.deleteDesc")}
        confirmLabel={a.t("admin.actions.confirm")}
        variant="destructive"
        onConfirm={() => void confirmDelete()}
      />
      {UnsavedChangesDialog}
    </AdminSectionShell>
  );
}
