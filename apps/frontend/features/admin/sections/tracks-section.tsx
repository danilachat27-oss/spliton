"use client";

import * as React from "react";
import { Info, Music2, Plus } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminTrackDrawer } from "@/features/admin/components/admin-track-drawer";
import type { AdminTrackFormBody } from "@/features/admin/lib/admin-track-form";
import { trackFormToPayload } from "@/features/admin/lib/admin-track-form";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { formatAdminDate, formatUnits, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AdminListQuery } from "@/features/admin/api/types";
import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  archiveAdminTrack,
  createAdminTrack,
  getAdminTrack,
  listAdminTracksPaginated,
  pauseAdminTrack,
  publishAdminTrack,
  submitAdminTrackReview,
  updateAdminTrack,
  uploadTrackAudioPreview,
  uploadTrackCover,
} from "@/services/admin/adminTracks.service";
import { listAdminReleaseGenres } from "@/services/admin/adminReleaseGenres.service";
import { cn } from "@/lib/utils";

const TRACK_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "pending"> = {
  draft: "neutral",
  review: "pending",
  published: "pending",
  active: "success",
  paused: "warning",
  completed: "success",
  archived: "neutral",
};

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
      ? "text-emerald-800"
      : tone === "warning"
        ? "text-amber-800"
        : tone === "info"
          ? "text-sky-800"
          : "text-zinc-100";
  return (
    <div className={cn(ADMIN_SECTION_TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

function UnitsProgress({ sold, total }: { sold: string; total: string }) {
  const soldN = Number(String(sold).replace(/[^\d.-]/g, ""));
  const totalN = Number(String(total).replace(/[^\d.-]/g, ""));
  const pct = totalN > 0 ? Math.min(100, Math.round((soldN / totalN) * 100)) : 0;
  return (
    <div className="min-w-[128px]">
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800/60">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs tabular-nums text-zinc-500">
        {formatUnits(sold)} / {formatUnits(total)} · {pct}%
      </p>
    </div>
  );
}

export function TracksSection() {
  const a = useAdminI18n();
  const statusFilterOptions = React.useMemo(
    () => [
      { value: "all", label: a.actions.allStatuses },
      { value: "draft", label: a.formatTrackStatus("draft") },
      { value: "review", label: a.formatTrackStatus("review") },
      { value: "published", label: a.formatTrackStatus("published") },
      { value: "active", label: a.formatTrackStatus("active") },
      { value: "paused", label: a.formatTrackStatus("paused") },
      { value: "completed", label: a.formatTrackStatus("completed") },
      { value: "archived", label: a.formatTrackStatus("archived") },
    ],
    [a],
  );
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const canEdit = perms.can("Tracks", "create") || perms.can("Tracks", "update");
  const canPublish = perms.can("Tracks", "update") || perms.can("Tracks", "create");
  const isReadOnly = perms.readOnly("Tracks");

  const loader = React.useCallback(
    (q: AdminListQuery) => listAdminTracksPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);
  const rows = page.items;

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [genre, setGenre] = React.useState("all");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editTrack, setEditTrack] = React.useState<AdminTrackListItem | null>(null);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [saving, setSaving] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [mediaUploading, setMediaUploading] = React.useState<"cover" | "audio" | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  function actionError(e: unknown, fallback: string) {
    setFeedback(e instanceof Error ? e.message : fallback);
  }

  const [genreOptions, setGenreOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    void listAdminReleaseGenres(undefined, client, { activeOnly: true })
      .then((items) => setGenreOptions(items.map((g) => g.name).sort()))
      .catch(() => undefined);
  }, [client]);

  const genres = React.useMemo(() => {
    const set = new Set([...genreOptions, ...rows.map((t) => t.genre).filter(Boolean)]);
    return ["all", ...Array.from(set).sort()];
  }, [genreOptions, rows]);

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: search || undefined,
      status: status === "all" ? undefined : status,
      genre: genre === "all" ? undefined : genre,
    }));
  }, [search, status, genre, setQuery]);

  const pageStats = React.useMemo(() => {
    const active = rows.filter((t) => t.status === "active").length;
    const review = rows.filter((t) => t.status === "review" || t.status === "draft").length;
    const soldUnits = rows.reduce(
      (sum, t) => sum + Number(String(t.soldUnits).replace(/[^\d.-]/g, "") || 0),
      0,
    );
    return { active, review, soldUnits };
  }, [rows]);

  const columns: AdminColumn<AdminTrackListItem>[] = [
    {
      key: "title",
      header: "Релиз",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400">
            <Music2 className="size-4" strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-medium text-zinc-100">{r.title}</p>
            <p className="text-xs text-zinc-500">{r.artist}</p>
          </div>
        </div>
      ),
    },
    {
      key: "genre",
      header: "Жанр",
      render: (r) => <AdminStatusBadge label={r.genre} tone="neutral" />,
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <AdminStatusBadge
          label={a.formatTrackStatus(r.status)}
          tone={TRACK_STATUS_TONE[r.status] ?? "neutral"}
        />
      ),
    },
    {
      key: "units",
      header: "Продажа юнитов",
      render: (r) => <UnitsProgress sold={r.soldUnits} total={r.totalUnits} />,
    },
    {
      key: "pool",
      header: "Пул дохода",
      render: (r) => <span className="tabular-nums text-zinc-200">{r.revenueSharePoolPct}%</span>,
    },
    {
      key: "raise",
      header: "Цель раунда",
      render: (r) => (
        <span className="whitespace-nowrap tabular-nums text-zinc-200">
          {formatUsdtAmount(r.raiseTargetUsdt)}
        </span>
      ),
    },
    {
      key: "created",
      header: a.table.created,
      render: (r) => (
        <span className="whitespace-nowrap tabular-nums text-zinc-400">
          {formatAdminDate(r.createdAt)}
        </span>
      ),
    },
    {
      key: "open",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800/60"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(r);
          }}
        >
          {canEdit ? "Изменить" : "Открыть"}
        </button>
      ),
    },
  ];

  function openCreate() {
    setEditTrack(null);
    setMode("create");
    setDrawerOpen(true);
  }

  function openEdit(track: AdminTrackListItem) {
    setEditTrack(track);
    setMode("edit");
    setDrawerOpen(true);
    setDetailLoading(true);
    void getAdminTrack(track.id, client)
      .then(setEditTrack)
      .catch(() => setEditTrack(track))
      .finally(() => setDetailLoading(false));
  }

  async function persistTrack(body: AdminTrackFormBody) {
    setFeedback(null);
    try {
      const payload = trackFormToPayload(body);
      if (mode === "create") {
        const created = await createAdminTrack(payload, client);
        setEditTrack(created);
        setMode("edit");
        setFeedback("Черновик создан — можно загрузить обложку и настроить раунд.");
      } else if (editTrack) {
        const updated = await updateAdminTrack(editTrack.id, payload, client);
        setEditTrack(updated);
        setFeedback("Сохранено");
      }
      await reload();
    } catch (e) {
      actionError(e, "Ошибка сохранения релиза");
      throw e;
    }
  }

  return (
    <AdminSectionShell
      sectionId="tracks"
      title={a.adminSectionLabel("tracks")}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <AdminSectionRefreshButton onClick={reload} />
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 rounded-xl bg-neutral-900 px-4 text-xs font-semibold text-white hover:bg-neutral-800"
              onClick={openCreate}
            >
              <Plus className="size-3.5" aria-hidden />
              Создать релиз
            </Button>
          ) : null}
        </div>
      }
    >
      {isReadOnly || !canEdit ? <AdminReadOnlyBanner area={a.adminSectionLabel("tracks")} /> : null}
      {feedback ? (
        <p className={`text-sm ${feedback.includes("Ошиб") ? "text-red-600" : "text-zinc-400"}`}>{feedback}</p>
      ) : null}

      <div className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3.5 shadow-sm shadow-zinc-900/[0.03]">
        <Info className="mt-0.5 size-4 shrink-0 text-zinc-400" strokeWidth={2} />
        <p className="text-sm leading-relaxed text-zinc-400">
          Управление треками и релизами: параметры распределения дохода, юниты, финансовые условия
          раунда и статус публикации. Изменения фиксируются в журнале действий.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={a.t("admin.kpi.tracks.totalReleases")} value={loading ? "…" : String(page.total)} />
        <StatTile
          label={a.t("admin.kpi.activeOnPage")}
          value={loading ? "…" : String(pageStats.active)}
          tone="success"
        />
        <StatTile
          label={a.t("admin.kpi.tracks.draftsAndReview")}
          value={loading ? "…" : String(pageStats.review)}
          tone="warning"
        />
        <StatTile
          label={a.t("admin.kpi.tracks.unitsSoldOnPage")}
          value={loading ? "…" : formatUnits(pageStats.soldUnits)}
          tone="info"
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
              placeholder: "Название, артист, ID…",
            },
            {
              id: "status",
              label: a.table.status,
              type: "select",
              value: status,
              onChange: setStatus,
              options: statusFilterOptions,
            },
            {
              id: "genre",
              label: "Жанр",
              type: "select",
              value: genre,
              onChange: setGenre,
              options: genres.map((g) => ({
                value: g,
                label: g === "all" ? a.actions.all : g,
              })),
            },
          ]}
        />

        <AdminSectionDataArea
          loading={loading}
          error={error}
          onRetry={reload}
          loadingLabel="Загрузка релизов…"
        >
          <AdminDataTable
            flat
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={openEdit}
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

      <AdminTrackDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        track={editTrack}
        mode={mode}
        saving={saving}
        loading={detailLoading}
        readOnly={!canEdit}
        canPublish={canPublish}
        onSubmit={async (body) => {
          setSaving(true);
          try {
            await persistTrack(body);
          } catch {
            /* feedback set in persistTrack */
          } finally {
            setSaving(false);
          }
        }}
        onSubmitReview={
          editTrack
            ? async () => {
                setSaving(true);
                setFeedback(null);
                try {
                  const updated = await submitAdminTrackReview(editTrack.id, client);
                  setEditTrack(updated);
                  setFeedback("Отправлено на проверку");
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка отправки на проверку");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onPublish={
          editTrack
            ? async () => {
                setSaving(true);
                setFeedback(null);
                try {
                  const updated = await publishAdminTrack(editTrack.id, client);
                  setEditTrack(updated);
                  setFeedback("Релиз опубликован");
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка публикации");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onPause={
          editTrack
            ? async () => {
                setSaving(true);
                setFeedback(null);
                try {
                  const updated = await pauseAdminTrack(editTrack.id, client);
                  setEditTrack(updated);
                  setFeedback("Релиз приостановлен");
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка приостановки");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onArchive={
          editTrack
            ? async () => {
                setSaving(true);
                setFeedback(null);
                try {
                  const updated = await archiveAdminTrack(editTrack.id, client);
                  setEditTrack(updated);
                  setFeedback("Релиз архивирован");
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка архивации");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        canUploadMedia={canEdit && mode === "edit"}
        mediaUploading={mediaUploading}
        onUploadCover={
          editTrack
            ? async (file) => {
                setMediaUploading("cover");
                setFeedback(null);
                try {
                  const updated = await uploadTrackCover(editTrack.id, file, client);
                  setEditTrack(updated);
                  setFeedback("Обложка загружена");
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка загрузки обложки");
                } finally {
                  setMediaUploading(null);
                }
              }
            : undefined
        }
        onUploadAudio={
          editTrack
            ? async (file) => {
                setMediaUploading("audio");
                setFeedback(null);
                try {
                  const updated = await uploadTrackAudioPreview(editTrack.id, file, client);
                  setEditTrack(updated);
                  setFeedback("Audio preview загружен");
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка загрузки audio preview");
                } finally {
                  setMediaUploading(null);
                }
              }
            : undefined
        }
      />
    </AdminSectionShell>
  );
}
