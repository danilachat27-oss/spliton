"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Plus, Search } from "@/lib/lucide";

import { AdminReleaseCatalogCard } from "@/features/admin/components/admin-release-catalog-card";
import { AdminTrackDrawer } from "@/features/admin/components/admin-track-drawer";
import { AdminTabIntro } from "@/features/admin/components/admin-tab-intro";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import type { AdminTrackFormBody } from "@/features/admin/lib/admin-track-form";
import { trackFormToPayload } from "@/features/admin/lib/admin-track-form";
import { trackToReleaseCard } from "@/features/admin/lib/admin-track-release-mapper";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { adminSurface } from "@/features/admin/lib/admin-ui";
import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";
import { ROUTES } from "@/constants/routes";
import { catalogGridClass } from "@/lib/catalog/catalog-filter";
import { cn } from "@/lib/utils";
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

export function ReleasesTab() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const canEdit = perms.can("Tracks", "create") || perms.can("Tracks", "update");
  const canPublish = perms.can("Tracks", "update") || perms.can("Tracks", "create");

  const [rows, setRows] = React.useState<AdminTrackListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editTrack, setEditTrack] = React.useState<AdminTrackListItem | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [mediaUploading, setMediaUploading] = React.useState<"cover" | "audio" | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void listAdminTracksPaginated(
      { page: 1, pageSize: 200, search: query.trim() || undefined },
      client,
    )
      .then((page) => setRows(page.items))
      .catch((e) => setError(localizedAdminError(e)))
      .finally(() => setLoading(false));
  }, [client, query]);

  React.useEffect(() => {
    load();
  }, [load]);

  const cards = React.useMemo(() => rows.map(trackToReleaseCard), [rows]);

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
    load();
  }

  return (
    <div className="space-y-8">
      <AdminTabIntro
        kicker="CRM"
        title={a.t("admin.tab.releases")}
        description="Карточный вид релизов из live API. Создание и редактирование — через production drawer (те же данные, что в разделе «Треки»)."
      />

      {feedback ? (
        <p className={cn("text-sm", feedback.includes("Ошиб") ? "text-red-400" : "text-[#B7F500]")}>{feedback}</p>
      ) : null}
      {error ? <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="relative min-w-[200px] max-w-md flex-1">
          <label className="sr-only" htmlFor="releases-search">
            Поиск релизов
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="releases-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={a.t("admin.placeholder.releaseSearch")}
            className={cn(
              "h-10 w-full rounded-2xl bg-secondary/40 py-2 pl-10 pr-4 text-sm text-foreground outline-none",
              "placeholder:text-muted-foreground focus:bg-secondary/55",
            )}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={ROUTES.adminTracks}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-2xl bg-secondary/40 px-4 text-sm font-medium text-foreground transition hover:bg-secondary/55",
            )}
          >
            Таблица релизов
          </Link>
          <Link
            href={ROUTES.dashboardCatalog}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-2xl bg-secondary/40 px-4 text-sm font-medium text-foreground transition hover:bg-secondary/55",
            )}
          >
            <ExternalLink className="size-4 text-muted-foreground" aria-hidden />
            Каталог
          </Link>
          {canEdit ? (
            <button
              type="button"
              onClick={openCreate}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-2xl bg-[#B7F500] px-4 text-sm font-semibold text-zinc-950 transition hover:bg-[#a8e600]",
              )}
            >
              <Plus className="size-4" aria-hidden />
              Новый релиз
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className={adminSurface("px-6 py-14 text-center")}>
          <p className="text-sm text-muted-foreground">Загрузка релизов…</p>
        </div>
      ) : cards.length === 0 ? (
        <div className={adminSurface("px-6 py-14 text-center")}>
          <p className="text-sm text-muted-foreground">Релизы не найдены.</p>
        </div>
      ) : (
        <div className={cn(catalogGridClass("grid"), "max-w-[1600px]")}>
          {rows.map((track) => (
            <AdminReleaseCatalogCard
              key={track.id}
              release={trackToReleaseCard(track)}
              onEdit={() => openEdit(track)}
            />
          ))}
        </div>
      )}

      <AdminTrackDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        track={editTrack}
        mode={mode}
        saving={saving}
        loading={detailLoading}
        readOnly={!canEdit}
        canPublish={canPublish}
        canUploadMedia={canEdit}
        mediaUploading={mediaUploading}
        onSubmit={async (body) => {
          setSaving(true);
          try {
            await persistTrack(body);
          } catch (e) {
            setFeedback(localizedAdminError(e));
            throw e;
          } finally {
            setSaving(false);
          }
        }}
        onSubmitReview={
          editTrack
            ? async () => {
                setSaving(true);
                try {
                  const updated = await submitAdminTrackReview(editTrack.id, client);
                  setEditTrack(updated);
                  setFeedback("Отправлено на проверку");
                  load();
                } catch (e) {
                  setFeedback(localizedAdminError(e));
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
                try {
                  const updated = await publishAdminTrack(editTrack.id, client);
                  setEditTrack(updated);
                  setFeedback("Релиз опубликован");
                  load();
                } catch (e) {
                  setFeedback(localizedAdminError(e));
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
                try {
                  const updated = await pauseAdminTrack(editTrack.id, client);
                  setEditTrack(updated);
                  setFeedback("Релиз приостановлен");
                  load();
                } catch (e) {
                  setFeedback(localizedAdminError(e));
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
                try {
                  const updated = await archiveAdminTrack(editTrack.id, client);
                  setEditTrack(updated);
                  setFeedback("Релиз архивирован");
                  load();
                } catch (e) {
                  setFeedback(localizedAdminError(e));
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onUploadCover={
          editTrack
            ? async (file) => {
                setMediaUploading("cover");
                try {
                  const updated = await uploadTrackCover(editTrack.id, file, client);
                  setEditTrack(updated);
                  setFeedback("Обложка загружена");
                  load();
                } catch (e) {
                  setFeedback(localizedAdminError(e));
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
                try {
                  const updated = await uploadTrackAudioPreview(editTrack.id, file, client);
                  setEditTrack(updated);
                  setFeedback("Preview загружен");
                  load();
                } catch (e) {
                  setFeedback(localizedAdminError(e));
                } finally {
                  setMediaUploading(null);
                }
              }
            : undefined
        }
      />
    </div>
  );
}
