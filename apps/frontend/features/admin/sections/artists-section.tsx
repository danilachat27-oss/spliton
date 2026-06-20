"use client";

import * as React from "react";
import { Plus } from "@/lib/lucide";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { AdminArtistPlatformSearch } from "@/features/admin/components/admin-artist-platform-search";
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
  AdminKpiValue,
  AdminReadOnlyBanner,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  createAdminArtist,
  deleteAdminArtist,
  listAdminArtists,
  updateAdminArtist,
  type AdminArtistListItem,
  type AdminArtistsListQuery,
} from "@/services/admin/adminArtists.service";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { cn } from "@/lib/utils";

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "info"
          ? "text-sky-400"
          : undefined;

  return (
    <div className={cn(ADMIN_SECTION_TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <AdminKpiValue value={value} className={cn("mt-1!", valueClass)} />
    </div>
  );
}

export function ArtistsSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const readOnly = perms.readOnly("Tracks");

  const [rows, setRows] = React.useState<AdminArtistListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [releases, setReleases] = React.useState("all");
  const [sort, setSort] = React.useState("name_asc");
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<AdminArtistListItem | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [baseline, setBaseline] = React.useState({ name: "", slug: "" });
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminArtistListItem | null>(null);

  const listQuery = React.useMemo<AdminArtistsListQuery>(
    () => ({ search, status, releases, sort }),
    [search, status, releases, sort],
  );

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
    void listAdminArtists(listQuery, client)
      .then(setRows)
      .catch((e) => setError(localizedAdminError(e)))
      .finally(() => setLoading(false));
  }, [client, listQuery]);

  React.useEffect(() => {
    load();
  }, [load]);

  const stats = React.useMemo(() => {
    const active = rows.filter((r) => r.isActive !== false).length;
    const withReleases = rows.filter((r) => r.releaseCount > 0).length;
    return {
      total: rows.length,
      active,
      withReleases,
      withoutReleases: rows.length - withReleases,
    };
  }, [rows]);

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

  async function toggleActive(row: AdminArtistListItem) {
    if (readOnly) return;
    try {
      await updateAdminArtist(row.id, { isActive: row.isActive === false }, client);
      setFeedback(row.isActive === false ? a.t("admin.artists.reactivated") : a.t("admin.artists.deactivated"));
      load();
    } catch (e) {
      setError(localizedAdminError(e));
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
    {
      key: "name",
      header: a.t("admin.artists.col.name"),
      render: (r) => (
        <span className={cn(r.isActive === false && "text-zinc-500 line-through")}>{r.name}</span>
      ),
    },
    {
      key: "slug",
      header: a.t("admin.artists.col.slug"),
      render: (r) => <span className="font-mono text-xs text-zinc-400">{r.slug}</span>,
    },
    {
      key: "releases",
      header: a.t("admin.artists.col.releases"),
      render: (r) => <span className="tabular-nums">{r.releaseCount}</span>,
    },
    {
      key: "status",
      header: a.t("admin.artists.col.status"),
      render: (r) => (
        <AdminStatusBadge
          label={r.isActive === false ? a.t("admin.artists.inactive") : a.t("admin.artists.active")}
          tone={r.isActive === false ? "neutral" : "success"}
        />
      ),
    },
    {
      key: "created",
      header: a.t("admin.artists.col.created"),
      render: (r) => formatAdminDate(r.createdAt),
    },
  ];

  return (
    <AdminSectionShell
      sectionId="artists"
      title={a.adminSectionLabel("artists")}
      infoHint={a.t("admin.artists.infoHint")}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <AdminSectionRefreshButton onClick={load} />
          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 rounded-xl bg-[#B7F500] px-4 text-xs font-semibold text-zinc-950 hover:bg-[#a8e600]"
              onClick={openCreate}
            >
              <Plus className="size-3.5" aria-hidden />
              {a.t("admin.artists.create")}
            </Button>
          ) : null}
        </div>
      }
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("artists")} /> : null}
      {feedback ? (
        <p className="rounded-xl border border-[#B7F500]/30 bg-[#B7F500]/10 px-4 py-2 text-sm text-[#B7F500]">
          {feedback}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={a.t("admin.artists.kpi.total")}
          value={loading ? "…" : String(stats.total)}
        />
        <StatTile
          label={a.t("admin.artists.kpi.active")}
          value={loading ? "…" : String(stats.active)}
          tone="success"
        />
        <StatTile
          label={a.t("admin.artists.kpi.withReleases")}
          value={loading ? "…" : String(stats.withReleases)}
          tone="info"
        />
        <StatTile
          label={a.t("admin.artists.kpi.withoutReleases")}
          value={loading ? "…" : String(stats.withoutReleases)}
          tone="warning"
        />
      </div>

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          fields={[
            {
              id: "artist-search",
              label: "Поиск",
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: a.t("admin.artists.searchPlaceholder"),
            },
            {
              id: "artist-status",
              label: a.t("admin.artists.filter.status"),
              type: "select",
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: a.actions.allStatuses },
                { value: "active", label: a.t("admin.artists.active") },
                { value: "inactive", label: a.t("admin.artists.inactive") },
              ],
            },
            {
              id: "artist-releases",
              label: a.t("admin.artists.filter.releases"),
              type: "select",
              value: releases,
              onChange: setReleases,
              options: [
                { value: "all", label: a.t("admin.artists.filter.releases.all") },
                { value: "with", label: a.t("admin.artists.filter.releases.with") },
                { value: "without", label: a.t("admin.artists.filter.releases.without") },
              ],
            },
            {
              id: "artist-sort",
              label: a.t("admin.artists.filter.sort"),
              type: "select",
              value: sort,
              onChange: setSort,
              options: [
                { value: "name_asc", label: a.t("admin.artists.filter.sort.nameAsc") },
                { value: "name_desc", label: a.t("admin.artists.filter.sort.nameDesc") },
                { value: "created_desc", label: a.t("admin.artists.filter.sort.createdDesc") },
                { value: "releases_desc", label: a.t("admin.artists.filter.sort.releasesDesc") },
              ],
            },
          ]}
        />

        <AdminSectionDataArea loading={loading} error={error ? true : undefined} onRetry={load}>
          {error ? (
            <p className="mb-3 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
          ) : null}
          <AdminDataTable
            flat
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
                editRow ? (
                  <div className="flex flex-wrap gap-2">
                    <AdminDrawerSecondaryButton onClick={() => void toggleActive(editRow)}>
                      {editRow.isActive === false
                        ? a.t("admin.artists.reactivate")
                        : a.t("admin.artists.deactivate")}
                    </AdminDrawerSecondaryButton>
                    {editRow.releaseCount === 0 ? (
                      <AdminDrawerDangerButton onClick={() => setDeleteTarget(editRow)}>
                        {a.t("admin.artists.delete")}
                      </AdminDrawerDangerButton>
                    ) : null}
                  </div>
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
          <AdminArtistPlatformSearch artistName={name} />
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
