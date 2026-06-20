"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { AdminNewsDrawer } from "@/features/admin/components/admin-news-drawer";
import { newsFormToPayload } from "@/features/admin/components/admin-news-drawer";
import type { AdminNewsFormBody } from "@/features/admin/components/admin-news-drawer";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminDataTable, AdminLocalizedStatusBadge, AdminReadOnlyBanner, type AdminColumn } from "@/features/admin/ui";
import {
  archiveAdminNewsPost,
  createAdminNewsPost,
  getAdminNewsPost,
  listAdminNewsPaginated,
  publishAdminNewsPost,
  unpublishAdminNewsPost,
  updateAdminNewsPost,
  uploadAdminNewsCover,
  type AdminNewsPost,
} from "@/services/admin/adminNews.service";

function canManageNews(roles?: string[]): boolean {
  return roles?.some((r) => ["SUPER_ADMIN", "ADMIN", "NEWS_MANAGER"].includes(r)) ?? false;
}

function canViewNews(roles?: string[]): boolean {
  return (
    canManageNews(roles) ||
    (roles?.some((r) => ["CONTENT_MANAGER"].includes(r)) ?? false)
  );
}

export function NewsSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const roles = user?.roles;
  const canEdit = canManageNews(roles);
  const canView = canViewNews(roles);

  const [rows, setRows] = React.useState<AdminNewsPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editPost, setEditPost] = React.useState<AdminNewsPost | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [coverUploading, setCoverUploading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    void listAdminNewsPaginated({ pageSize: 100 }, client)
      .then((r) => setRows(r.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [canView, client]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    if (!canEdit) return;
    setMode("create");
    setEditPost(null);
    setDrawerOpen(true);
    setFeedback(null);
  }

  async function openEdit(row: AdminNewsPost) {
    setMode("edit");
    setEditPost(row);
    setDrawerOpen(true);
    setFeedback(null);
    setDetailLoading(true);
    try {
      const detail = await getAdminNewsPost(row.id, client);
      setEditPost(detail);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Не удалось загрузить новость");
    } finally {
      setDetailLoading(false);
    }
  }

  async function persistNews(form: AdminNewsFormBody) {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = newsFormToPayload(form);
      if (mode === "create") {
        const created = await createAdminNewsPost(payload, client);
        setEditPost(created);
        setMode("edit");
        setFeedback("Черновик создан — можно загрузить обложку и опубликовать.");
      } else if (editPost) {
        const updated = await updateAdminNewsPost(editPost.id, payload, client);
        setEditPost(updated);
        setFeedback("Сохранено");
      }
      load();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Ошибка сохранения");
      throw e;
    } finally {
      setSaving(false);
    }
  }

  const columns: AdminColumn<AdminNewsPost>[] = [
    {
      key: "cover",
      header: "",
      render: (r) =>
        r.coverUrl ? (
          <div className="size-10 overflow-hidden rounded-lg border border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.coverUrl} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        ),
    },
    { key: "title", header: "Заголовок", render: (r) => r.title },
    {
      key: "slug",
      header: a.t("admin.helpCenter.field.slug"),
      render: (r) => <span className="font-mono text-xs">{r.slug}</span>,
    },
    { key: "cat", header: "Категория", render: (r) => r.category },
    {
      key: "st",
      header: "Статус",
      render: (r) => {
        const { status: rowStatus } = r;
        return <AdminLocalizedStatusBadge status={rowStatus} />;
      },
    },
    {
      key: "updated",
      header: "Обновлено",
      render: (r) => (
        <span className="text-xs text-zinc-500">{r.updatedAt.slice(0, 16).replace("T", " ")}</span>
      ),
    },
  ];

  if (!canView) {
    return (
      <AdminSectionShell sectionId="news" title={a.t("admin.title.newsSpliton")}>
        <AdminSectionPanel>
          <p className="py-8 text-center text-sm text-zinc-500">
            Недостаточно прав для просмотра новостей.
          </p>
        </AdminSectionPanel>
      </AdminSectionShell>
    );
  }

  return (
    <AdminSectionShell
      sectionId="news"
      title={a.t("admin.title.newsSpliton")}
      actions={<AdminSectionRefreshButton onClick={load} />}
    >
      {!canEdit ? <AdminReadOnlyBanner area="Новости" /> : null}
      <AdminSectionPanel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {canEdit ? (
            <Button type="button" onClick={openCreate}>
              Создать новость
            </Button>
          ) : null}
          {feedback ? (
            <p className={`text-sm ${feedback.includes("Ошиб") ? "text-red-600" : "text-zinc-400"}`}>
              {feedback}
            </p>
          ) : null}
        </div>
        <AdminSectionDataArea loading={loading} error={error} onRetry={load}>
          <AdminDataTable
            flat
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={canEdit ? openEdit : undefined}
            emptyMessage="Нет новостей"
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminNewsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        post={editPost}
        mode={mode}
        saving={saving}
        loading={detailLoading}
        readOnly={!canEdit}
        coverUploading={coverUploading}
        onSubmit={persistNews}
        onPublish={
          canEdit && editPost
            ? async () => {
                setSaving(true);
                try {
                  const updated = await publishAdminNewsPost(editPost.id, client);
                  setEditPost(updated);
                  setFeedback("Опубликовано");
                  load();
                } catch (e) {
                  setFeedback(e instanceof Error ? e.message : "Ошибка публикации");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onUnpublish={
          canEdit && editPost
            ? async () => {
                setSaving(true);
                try {
                  const updated = await unpublishAdminNewsPost(editPost.id, client);
                  setEditPost(updated);
                  setFeedback("Снято с публикации");
                  load();
                } catch (e) {
                  setFeedback(e instanceof Error ? e.message : "Ошибка");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onArchive={
          canEdit && editPost
            ? async () => {
                setSaving(true);
                try {
                  const updated = await archiveAdminNewsPost(editPost.id, client);
                  setEditPost(updated);
                  setFeedback("Новость архивирована");
                  load();
                } catch (e) {
                  setFeedback(e instanceof Error ? e.message : "Ошибка архивации");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onUploadCover={
          canEdit && editPost
            ? async (file) => {
                setCoverUploading(true);
                try {
                  const updated = await uploadAdminNewsCover(editPost.id, file, client);
                  setEditPost(updated);
                  setFeedback("Обложка загружена");
                  load();
                } catch (e) {
                  setFeedback(e instanceof Error ? e.message : "Ошибка загрузки обложки");
                } finally {
                  setCoverUploading(false);
                }
              }
            : undefined
        }
      />
    </AdminSectionShell>
  );
}
