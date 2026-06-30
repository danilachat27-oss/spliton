"use client";

import * as React from "react";
import { ImageIcon, Plus, Star } from "@/lib/lucide";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import {
  AdminNewsDrawer,
  NEWS_CATEGORY_VALUES,
  NEWS_AUDIENCE_VALUES,
  newsFormToPayload,
  type AdminNewsFormBody,
} from "@/features/admin/components/admin-news-drawer";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminBtnGhost, adminSectionCreateButton, adminSectionToolbarActions } from "@/features/admin/lib/admin-ui";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminFilterPills,
  AdminFilterResultCount,
  AdminLocalizedStatusBadge,
  AdminPagination,
  AdminReadOnlyBanner,
  type AdminColumn,
} from "@/features/admin/ui";
import { cn } from "@/lib/utils";
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

const SORT_OPTIONS = [
  { value: "updated_desc", label: "Сначала новые" },
  { value: "updated_asc", label: "Сначала старые" },
  { value: "title_asc", label: "Заголовок А→Я" },
  { value: "title_desc", label: "Заголовок Я→А" },
];

function canManageNews(roles?: string[]): boolean {
  return roles?.some((r) => ["SUPER_ADMIN", "ADMIN", "NEWS_MANAGER"].includes(r)) ?? false;
}

function canViewNews(roles?: string[]): boolean {
  return (
    canManageNews(roles) ||
    (roles?.some((r) => ["CONTENT_MANAGER"].includes(r)) ?? false)
  );
}

function sortNewsRows(rows: AdminNewsPost[], sortBy: string): AdminNewsPost[] {
  const sorted = [...rows];
  switch (sortBy) {
    case "updated_asc":
      sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      break;
    case "title_asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
      break;
    case "title_desc":
      sorted.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: "base" }));
      break;
    default:
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
  }
  return sorted;
}

function NewsCoverThumb({ coverUrl }: { coverUrl: string | null }) {
  const [failed, setFailed] = React.useState(false);
  const showPlaceholder = !coverUrl?.trim() || failed;

  if (showPlaceholder) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-500">
        <ImageIcon className="size-4" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-800/60">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl!.trim()}
        alt=""
        className="size-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

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
          : "text-zinc-100";
  return (
    <div className={cn(ADMIN_SECTION_TILE, "flex min-h-[5.5rem] min-w-0 flex-col justify-between gap-2")}>
      <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

export function NewsSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const roles = user?.roles;
  const canEdit = canManageNews(roles);
  const canView = canViewNews(roles);

  const loader = React.useCallback(
    (q: Parameters<typeof listAdminNewsPaginated>[0]) => listAdminNewsPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("updated_desc");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editPost, setEditPost] = React.useState<AdminNewsPost | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [coverUploading, setCoverUploading] = React.useState(false);
  const [pendingCoverFile, setPendingCoverFile] = React.useState<File | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const statusOptions = React.useMemo(
    () => [
      { value: "all", label: a.actions.allStatuses },
      { value: "published", label: a.formatAdminStatus("published") },
      { value: "draft", label: a.formatAdminStatus("draft") },
      { value: "archived", label: a.formatAdminStatus("archived") },
    ],
    [a],
  );

  const categoryOptions = React.useMemo(
    () => [
      { value: "all", label: a.actions.all },
      ...NEWS_CATEGORY_VALUES.map((value) => ({
        value,
        label: a.t(`admin.drawer.news.category.${value}`),
      })),
    ],
    [a],
  );

  const sortOptions = React.useMemo(
    () =>
      SORT_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    [],
  );

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      status: statusFilter === "all" ? undefined : statusFilter,
    }));
  }, [statusFilter, setQuery]);

  const filteredRows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    let items = page.items;
    if (term) {
      items = items.filter(
        (row) =>
          row.title.toLowerCase().includes(term) ||
          row.slug.toLowerCase().includes(term) ||
          (row.shortDescription?.toLowerCase().includes(term) ?? false),
      );
    }
    if (categoryFilter !== "all") {
      items = items.filter((row) => row.category === categoryFilter);
    }
    return sortNewsRows(items, sortBy);
  }, [page.items, search, categoryFilter, sortBy]);

  const pageStats = React.useMemo(
    () => ({
      published: page.items.filter((r) => r.status === "published").length,
      drafts: page.items.filter((r) => r.status === "draft").length,
      pinned: page.items.filter((r) => r.pinned).length,
      archived: page.items.filter((r) => r.status === "archived").length,
    }),
    [page.items],
  );

  function openCreate() {
    if (!canEdit) return;
    setMode("create");
    setEditPost(null);
    setPendingCoverFile(null);
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
    const wasCreate = mode === "create";
    try {
      const payload = newsFormToPayload(form);
      if (form.coverUrl.startsWith("blob:")) {
        delete payload.coverUrl;
      }

      let saved: AdminNewsPost;
      if (mode === "create") {
        saved = await createAdminNewsPost(payload, client);
        setEditPost(saved);
        setMode("edit");
      } else if (editPost) {
        saved = await updateAdminNewsPost(editPost.id, payload, client);
        setEditPost(saved);
      } else {
        return;
      }

      const fileToUpload = pendingCoverFile;
      if (fileToUpload) {
        setCoverUploading(true);
        try {
          saved = await uploadAdminNewsCover(saved.id, fileToUpload, client);
          setEditPost(saved);
          setPendingCoverFile(null);
        } finally {
          setCoverUploading(false);
        }
      }

      setFeedback(
        wasCreate
          ? fileToUpload
            ? "Черновик создан, обложка загружена."
            : "Черновик создан — можно опубликовать."
          : fileToUpload
            ? "Сохранено, обложка загружена."
            : "Сохранено",
      );
      reload();
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
      className: "w-14",
      render: (r) => <NewsCoverThumb coverUrl={r.coverUrl} />,
    },
    {
      key: "title",
      header: a.t("admin.drawer.news.field.title"),
      render: (r) => (
        <div className="min-w-[180px]">
          <div className="flex items-start gap-1.5">
            {r.pinned ? (
              <Star className="mt-0.5 size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100">{r.title}</p>
              {r.shortDescription ? (
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">{r.shortDescription}</p>
              ) : null}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "slug",
      header: a.t("admin.helpCenter.field.slug"),
      render: (r) => <span className="font-mono text-xs text-zinc-400">{r.slug}</span>,
    },
    {
      key: "cat",
      header: a.t("admin.drawer.news.field.category"),
      render: (r) => (
        <span className="text-sm text-zinc-300">
          {NEWS_CATEGORY_VALUES.includes(r.category as (typeof NEWS_CATEGORY_VALUES)[number])
            ? a.t(`admin.drawer.news.category.${r.category}`)
            : r.category}
        </span>
      ),
    },
    {
      key: "st",
      header: a.table.status,
      render: (r) => {
        const rowStatus = r.status;
        return <AdminLocalizedStatusBadge status={rowStatus} />;
      },
    },
    {
      key: "audience",
      header: a.t("admin.drawer.news.field.audience"),
      render: (r) => (
        <span className="text-xs text-zinc-400">
          {NEWS_AUDIENCE_VALUES.includes(r.audience as (typeof NEWS_AUDIENCE_VALUES)[number])
            ? a.t(`admin.drawer.news.audience.${r.audience}`)
            : r.audience}
        </span>
      ),
    },
    {
      key: "updated",
      header: a.table.updated,
      render: (r) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-zinc-400">{formatAdminDate(r.updatedAt)}</span>
      ),
    },
    {
      key: "open",
      header: "",
      className: "w-px whitespace-nowrap text-right",
      render: (r) => (
        <button
          type="button"
          className={cn(adminBtnGhost, "h-8 shrink-0 px-3")}
          onClick={(e) => {
            e.stopPropagation();
            void openEdit(r);
          }}
        >
          {a.actions.detail}
        </button>
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
      infoHint={a.t("admin.news.infoHint")}
      actions={
        <>
          <AdminSectionRefreshButton onClick={reload} />
          {canEdit ? (
            <Button type="button" size="sm" className={adminSectionCreateButton} onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden />
              {a.t("admin.news.createBtn")}
            </Button>
          ) : null}
        </>
      }
    >
      {!canEdit ? <AdminReadOnlyBanner area={a.adminSectionLabel("news")} /> : null}
      {feedback ? (
        <p className={`text-sm ${feedback.includes("Ошиб") ? "text-red-400" : "text-zinc-400"}`}>{feedback}</p>
      ) : null}

      <div className={ADMIN_SECTION_KPI_GRID}>
        <StatTile label={a.t("admin.kpi.news.total")} value={loading ? "…" : String(page.total)} />
        <StatTile
          label={a.t("admin.kpi.news.publishedOnPage")}
          value={loading ? "…" : String(pageStats.published)}
          tone="success"
        />
        <StatTile
          label={a.t("admin.kpi.news.draftsOnPage")}
          value={loading ? "…" : String(pageStats.drafts)}
          tone="warning"
        />
        <StatTile
          label={a.t("admin.kpi.news.pinnedOnPage")}
          value={loading ? "…" : String(pageStats.pinned)}
          tone="info"
        />
        <StatTile
          label={a.t("admin.kpi.news.archivedOnPage")}
          value={loading ? "…" : String(pageStats.archived)}
        />
      </div>

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          panelWidthClassName="w-[min(100vw-1rem,520px)]"
          searchHint={a.t("admin.news.search.hint")}
          footer={
            <AdminFilterResultCount
              label={a.t("admin.filters.foundCount")}
              value={search.trim() || categoryFilter !== "all" ? filteredRows.length : page.total}
              className="w-full"
            />
          }
          fields={[
            {
              id: "search",
              label: a.t("admin.news.search.label"),
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: a.t("admin.news.search.placeholder"),
            },
            {
              id: "status",
              label: a.t("admin.news.filter.status"),
              type: "select",
              value: statusFilter,
              onChange: setStatusFilter,
              options: statusOptions,
            },
            {
              id: "category",
              label: a.t("admin.news.filter.category"),
              type: "select",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: categoryOptions,
            },
            {
              id: "sort",
              label: a.t("admin.filters.sort"),
              type: "select",
              value: sortBy,
              onChange: setSortBy,
              options: sortOptions,
            },
          ]}
        />

        <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900/25 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
          <AdminFilterPills
            label={a.t("admin.news.filter.status")}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
          <AdminFilterPills
            label={a.t("admin.news.filter.category")}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
          />
        </div>

        <AdminSectionDataArea
          loading={loading}
          error={Boolean(error)}
          onRetry={reload}
          loadingLabel={a.t("admin.news.loading")}
        >
          <AdminDataTable
            flat
            borderless
            className="[&_table]:min-w-[920px]"
            columns={columns}
            rows={filteredRows}
            rowKey={(r) => r.id}
            onRowClick={canEdit ? (r) => void openEdit(r) : undefined}
            emptyMessage={a.t("admin.news.empty")}
          />
          <AdminPagination
            page={query.page ?? 1}
            pageSize={query.pageSize ?? 20}
            total={page.total}
            onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
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
                  reload();
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
                  reload();
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
                  reload();
                } catch (e) {
                  setFeedback(e instanceof Error ? e.message : "Ошибка архивации");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onCoverFileSelected={
          canEdit
            ? async (file) => {
                if (editPost) {
                  setCoverUploading(true);
                  try {
                    const updated = await uploadAdminNewsCover(editPost.id, file, client);
                    setEditPost(updated);
                    setPendingCoverFile(null);
                    setFeedback("Обложка загружена");
                    reload();
                  } catch (e) {
                    setFeedback(e instanceof Error ? e.message : "Ошибка загрузки обложки");
                  } finally {
                    setCoverUploading(false);
                  }
                } else {
                  setPendingCoverFile(file);
                }
              }
            : undefined
        }
      />
    </AdminSectionShell>
  );
}
