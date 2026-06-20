"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import {
  AdminHelpArticleDrawer,
  helpArticleFormToPayload,
  type AdminHelpArticleForm,
} from "@/features/admin/components/admin-help-article-drawer";
import {
  AdminHelpCategoryDrawer,
  helpCategoryFormToPayload,
  type AdminHelpCategoryForm,
} from "@/features/admin/components/admin-help-category-drawer";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
  AdminSectionTabBar,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminSectionTab } from "@/features/admin/hooks/use-admin-section-tab";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDateShort } from "@/features/admin/lib/admin-format";
import {
  canDeleteHelpContent,
  canManageHelpCategories,
  canMutateHelpArticles,
  canPublishHelpArticles,
  canViewHelpCenter,
} from "@/features/admin/lib/help-center-access";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminLocalizedStatusBadge,
  AdminReadOnlyBanner,
  AdminConfirmDialog,
  type AdminColumn,
  type AdminFilterField,
} from "@/features/admin/ui";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import {
  archiveAdminHelpArticle,
  createAdminHelpArticle,
  createAdminHelpCategory,
  deleteAdminHelpArticle,
  deleteAdminHelpCategory,
  listAdminHelpArticlesPaginated,
  listAdminHelpCategories,
  publishAdminHelpArticle,
  updateAdminHelpArticle,
  updateAdminHelpCategory,
  type AdminHelpArticle,
  type AdminHelpCategory,
} from "@/services/admin/adminHelpCenter.service";
import { fetchAllAdminPaginatedItems } from "@/services/admin/admin-api.util";
import { cn } from "@/lib/utils";

const HELP_TAB_KEYS = [
  { id: "overview", labelKey: "admin.helpCenter.tab.overview" },
  { id: "categories", labelKey: "admin.helpCenter.tab.categories" },
  { id: "articles", labelKey: "admin.helpCenter.tab.articles" },
  { id: "popular", labelKey: "admin.helpCenter.tab.popular" },
  { id: "getting-started", labelKey: "admin.helpCenter.tab.gettingStarted" },
  { id: "drafts", labelKey: "admin.helpCenter.tab.drafts" },
] as const;

type HelpTab = (typeof HELP_TAB_KEYS)[number]["id"];

function categoryLabel(categories: AdminHelpCategory[], id: string | null): string {
  if (!id) return "Без категории";
  const row = categories.find((c) => c.id === id);
  return row?.titlePreview || row?.slug || id.slice(0, 8);
}

function parentLabel(categories: AdminHelpCategory[], parentId: string | null): string {
  if (!parentId) return "Корневая";
  return categoryLabel(categories, parentId);
}

function isInactiveFilter(value: string): boolean {
  return value.trim() === "" || value === "all";
}

function sortHelpArticles(rows: AdminHelpArticle[], sort: string): AdminHelpArticle[] {
  const sorted = [...rows];
  switch (sort) {
    case "updated_desc":
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
    case "updated_asc":
      sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      break;
    case "title_asc":
      sorted.sort((a, b) =>
        (a.titlePreview || a.slug).localeCompare(b.titlePreview || b.slug, undefined, { sensitivity: "base" }),
      );
      break;
    case "title_desc":
      sorted.sort((a, b) =>
        (b.titlePreview || b.slug).localeCompare(a.titlePreview || a.slug, undefined, { sensitivity: "base" }),
      );
      break;
    case "views_desc":
      sorted.sort((a, b) => b.viewCount - a.viewCount || b.updatedAt.localeCompare(a.updatedAt));
      break;
    default:
      sorted.sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt.localeCompare(a.updatedAt));
      break;
  }
  return sorted;
}

export function HelpCenterSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const { messageFor } = useApiErrorMessage();
  const roles = user?.roles;

  const canView = canViewHelpCenter(roles);
  const canEditCategories = canManageHelpCategories(roles);
  const canEditArticles = canMutateHelpArticles(roles);
  const canPublish = canPublishHelpArticles(roles);
  const canDelete = canDeleteHelpContent(roles);

  const helpTabs = React.useMemo(
    () => HELP_TAB_KEYS.map((t) => ({ id: t.id, label: a.t(t.labelKey) })),
    [a],
  );

  const [tab, setTab] = useAdminSectionTab<HelpTab>(
    HELP_TAB_KEYS.map((t) => t.id),
    "overview",
  );

  const [categories, setCategories] = React.useState<AdminHelpCategory[]>([]);
  const [articles, setArticles] = React.useState<AdminHelpArticle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const [articleSearch, setArticleSearch] = React.useState("");
  const [articleStatusFilter, setArticleStatusFilter] = React.useState("");
  const [articleCategoryFilter, setArticleCategoryFilter] = React.useState("");
  const [articleFlagFilter, setArticleFlagFilter] = React.useState("");
  const [articleSort, setArticleSort] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState("");

  const [categoryDrawerOpen, setCategoryDrawerOpen] = React.useState(false);
  const [categoryMode, setCategoryMode] = React.useState<"create" | "edit">("create");
  const [editCategory, setEditCategory] = React.useState<AdminHelpCategory | null>(null);

  const [articleDrawerOpen, setArticleDrawerOpen] = React.useState(false);
  const [articleMode, setArticleMode] = React.useState<"create" | "edit">("create");
  const [editArticle, setEditArticle] = React.useState<AdminHelpArticle | null>(null);

  const [saving, setSaving] = React.useState(false);

  type PendingConfirm = {
    title: string;
    description: string;
    variant?: "destructive";
    action: () => Promise<void>;
  };
  const [pendingConfirm, setPendingConfirm] = React.useState<PendingConfirm | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  const load = React.useCallback(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    Promise.all([
      listAdminHelpCategories(client),
      fetchAllAdminPaginatedItems((query) => listAdminHelpArticlesPaginated(query, client)),
    ])
      .then(([cats, arts]) => {
        setCategories(cats);
        setArticles(arts);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [canView, client]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (tab !== "articles") setArticleStatusFilter("");
    if (tab === "popular" || tab === "getting-started") setArticleFlagFilter("");
  }, [tab]);

  const categorySelectOptions = React.useMemo(
    () => [
      { value: "", label: a.t("admin.helpCenter.filter.category.all") },
      ...categories
        .slice()
        .sort((x, y) => x.sortOrder - y.sortOrder)
        .map((c) => ({ value: c.id, label: c.titlePreview || c.slug })),
    ],
    [categories, a],
  );

  const articleSortOptions = React.useMemo(
    () => [
      { value: "", label: a.t("admin.helpCenter.filter.sort.default") },
      { value: "updated_desc", label: a.t("admin.helpCenter.filter.sort.updatedDesc") },
      { value: "updated_asc", label: a.t("admin.helpCenter.filter.sort.updatedAsc") },
      { value: "title_asc", label: a.t("admin.helpCenter.filter.sort.titleAsc") },
      { value: "title_desc", label: a.t("admin.helpCenter.filter.sort.titleDesc") },
      { value: "views_desc", label: a.t("admin.helpCenter.filter.sort.viewsDesc") },
      { value: "order_asc", label: a.t("admin.helpCenter.filter.sort.orderAsc") },
    ],
    [a],
  );

  const articleFilterFields = React.useMemo((): AdminFilterField[] => {
    const fields: AdminFilterField[] = [
      {
        id: "help-article-search",
        label: a.t("admin.helpCenter.filter.search"),
        type: "search",
        value: articleSearch,
        onChange: setArticleSearch,
        placeholder: a.t("admin.helpCenter.filter.searchPlaceholder"),
      },
    ];

    if (tab === "articles") {
      fields.push({
        id: "help-article-status",
        label: a.table.status,
        type: "select",
        value: articleStatusFilter,
        onChange: setArticleStatusFilter,
        options: [
          { value: "", label: a.actions.allStatuses },
          { value: "draft", label: a.formatAdminStatus("draft") },
          { value: "published", label: a.formatAdminStatus("published") },
          { value: "archived", label: a.formatAdminStatus("archived") },
        ],
      });
    }

    fields.push({
      id: "help-article-category",
      label: a.table.category,
      type: "select",
      value: articleCategoryFilter,
      onChange: setArticleCategoryFilter,
      options: categorySelectOptions,
    });

    if (tab === "articles" || tab === "drafts") {
      fields.push({
        id: "help-article-flag",
        label: a.t("admin.ui.tag"),
        type: "select",
        value: articleFlagFilter,
        onChange: setArticleFlagFilter,
        options: [
          { value: "", label: a.t("admin.helpCenter.filter.flags.all") },
          { value: "featured", label: a.t("admin.helpCenter.featured") },
          { value: "popular", label: a.t("admin.helpCenter.popular") },
          { value: "gettingStarted", label: a.t("admin.helpCenter.gettingStarted") },
          { value: "none", label: a.t("admin.helpCenter.filter.flags.none") },
        ],
      });
    }

    fields.push({
      id: "help-article-sort",
      label: a.t("admin.helpCenter.filter.sort"),
      type: "select",
      value: articleSort,
      onChange: setArticleSort,
      options: articleSortOptions,
    });

    return fields;
  }, [
    a,
    tab,
    articleSearch,
    articleStatusFilter,
    articleCategoryFilter,
    articleFlagFilter,
    articleSort,
    categorySelectOptions,
    articleSortOptions,
  ]);

  const categoryFilterFields = React.useMemo(
    (): AdminFilterField[] => [
      {
        id: "help-category-search",
        label: a.t("admin.helpCenter.filter.search"),
        type: "search",
        value: categorySearch,
        onChange: setCategorySearch,
        placeholder: a.t("admin.helpCenter.filter.categorySearchPlaceholder"),
      },
    ],
    [a, categorySearch],
  );

  const stats = React.useMemo(() => {
    const publishedCats = categories.filter((c) => c.isPublished).length;
    const draftArticles = articles.filter((a) => a.status === "draft").length;
    const publishedArticles = articles.filter((a) => a.status === "published").length;
    const archivedArticles = articles.filter((a) => a.status === "archived").length;
    return {
      categories: categories.length,
      publishedCats,
      hiddenCats: categories.length - publishedCats,
      articles: articles.length,
      draftArticles,
      publishedArticles,
      archivedArticles,
      featured: articles.filter((a) => a.isFeatured).length,
      popular: articles.filter((a) => a.isPopular).length,
      gettingStarted: articles.filter((a) => a.isGettingStarted).length,
    };
  }, [categories, articles]);

  const tabCounts = React.useMemo(
    () => ({
      overview: undefined,
      categories: categories.length,
      articles: articles.length,
      popular: articles.filter((a) => a.isPopular).length,
      "getting-started": articles.filter((a) => a.isGettingStarted).length,
      drafts: articles.filter((a) => a.status === "draft").length,
    }),
    [categories, articles],
  );

  const filteredArticles = React.useMemo(() => {
    let rows = [...articles];

    if (tab === "popular") rows = rows.filter((r) => r.isPopular);
    else if (tab === "getting-started") rows = rows.filter((r) => r.isGettingStarted);
    else if (tab === "drafts") rows = rows.filter((r) => r.status === "draft");

    if (tab === "articles" || tab === "popular" || tab === "getting-started" || tab === "drafts") {
      if (!isInactiveFilter(articleStatusFilter)) {
        rows = rows.filter((r) => r.status === articleStatusFilter);
      }
      if (!isInactiveFilter(articleCategoryFilter)) {
        rows = rows.filter((r) => r.categoryId === articleCategoryFilter);
      }
      if (articleFlagFilter === "featured") rows = rows.filter((r) => r.isFeatured);
      else if (articleFlagFilter === "popular") rows = rows.filter((r) => r.isPopular);
      else if (articleFlagFilter === "gettingStarted") rows = rows.filter((r) => r.isGettingStarted);
      else if (articleFlagFilter === "none") {
        rows = rows.filter((r) => !r.isFeatured && !r.isPopular && !r.isGettingStarted);
      }

      const q = articleSearch.trim().toLowerCase();
      if (q) {
        rows = rows.filter(
          (r) =>
            r.slug.toLowerCase().includes(q) ||
            r.titlePreview.toLowerCase().includes(q) ||
            Object.values(r.titleTranslations).some((t) => t.toLowerCase().includes(q)),
        );
      }
    }

    return sortHelpArticles(rows, articleSort);
  }, [articles, tab, articleStatusFilter, articleCategoryFilter, articleFlagFilter, articleSearch, articleSort]);

  const tabArticleTotal = React.useMemo(() => {
    if (tab === "popular") return articles.filter((r) => r.isPopular).length;
    if (tab === "getting-started") return articles.filter((r) => r.isGettingStarted).length;
    if (tab === "drafts") return articles.filter((r) => r.status === "draft").length;
    if (tab === "articles") return articles.length;
    return 0;
  }, [articles, tab]);

  const filteredCategories = React.useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    let rows = [...categories];
    if (q) {
      rows = rows.filter(
        (c) =>
          c.slug.toLowerCase().includes(q) ||
          c.titlePreview.toLowerCase().includes(q) ||
          Object.values(c.titleTranslations).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories, categorySearch]);

  function showFeedback(msg: string, isError = false) {
    setFeedback(isError ? msg : msg);
  }

  function openCreateCategory() {
    if (!canEditCategories) return;
    setCategoryMode("create");
    setEditCategory(null);
    setCategoryDrawerOpen(true);
    setFeedback(null);
  }

  function openEditCategory(row: AdminHelpCategory) {
    setCategoryMode("edit");
    setEditCategory(row);
    setCategoryDrawerOpen(true);
    setFeedback(null);
  }

  function openCreateArticle() {
    if (!canEditArticles) return;
    setArticleMode("create");
    setEditArticle(null);
    setArticleDrawerOpen(true);
    setFeedback(null);
  }

  function openEditArticle(row: AdminHelpArticle) {
    setArticleMode("edit");
    setEditArticle(row);
    setArticleDrawerOpen(true);
    setFeedback(null);
  }

  async function persistCategory(form: AdminHelpCategoryForm) {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = helpCategoryFormToPayload(form);
      if (categoryMode === "create") {
        const created = await createAdminHelpCategory(payload, client);
        setEditCategory(created);
        setCategoryMode("edit");
        showFeedback("Категория создана");
      } else if (editCategory) {
        await updateAdminHelpCategory(editCategory.id, payload, client);
        showFeedback("Категория сохранена");
      }
      load();
    } catch (e) {
      showFeedback(messageFor(e), true);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategoryPublish(published: boolean) {
    if (!editCategory) return;
    setSaving(true);
    try {
      const updated = await updateAdminHelpCategory(editCategory.id, { isPublished: published }, client);
      setEditCategory(updated);
      showFeedback(published ? "Категория опубликована" : "Категория скрыта");
      load();
    } catch (e) {
      showFeedback(messageFor(e), true);
    } finally {
      setSaving(false);
    }
  }

  async function requestToggleCategoryPublish(published: boolean) {
    if (!editCategory || !canEditCategories) return;
    if (published) {
      await toggleCategoryPublish(true);
      return;
    }
    setPendingConfirm({
      title: a.t("admin.drawer.help.confirm.hideCategory.title"),
      description: a.t("admin.drawer.help.confirm.hideCategory.description").replace(
        "{name}",
        editCategory.titlePreview || editCategory.slug,
      ),
      action: () => toggleCategoryPublish(false),
    });
  }

  async function deleteCategoryNow() {
    if (!editCategory || !canDelete) return;
    setSaving(true);
    try {
      await deleteAdminHelpCategory(editCategory.id, client);
      setCategoryDrawerOpen(false);
      showFeedback("Категория удалена");
      load();
    } catch (e) {
      showFeedback(messageFor(e), true);
    } finally {
      setSaving(false);
    }
  }

  async function requestRemoveCategory(): Promise<void> {
    if (!editCategory || !canDelete) return;
    setPendingConfirm({
      title: a.t("admin.drawer.help.confirm.deleteCategory.title"),
      description: a.t("admin.drawer.help.confirm.deleteCategory.description").replace(
        "{name}",
        editCategory.titlePreview || editCategory.slug,
      ),
      variant: "destructive",
      action: deleteCategoryNow,
    });
  }

  async function persistArticle(form: AdminHelpArticleForm) {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = helpArticleFormToPayload(form);
      if (articleMode === "create") {
        const created = await createAdminHelpArticle(payload, client);
        setEditArticle(created);
        setArticleMode("edit");
        showFeedback("Черновик создан. Можно опубликовать после проверки");
      } else if (editArticle) {
        const updated = await updateAdminHelpArticle(editArticle.id, payload, client);
        setEditArticle(updated);
        showFeedback("Статья сохранена");
      }
      load();
    } catch (e) {
      showFeedback(messageFor(e), true);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function publishArticleNow() {
    if (!editArticle || !canPublish) return;
    setSaving(true);
    try {
      const updated = await publishAdminHelpArticle(editArticle.id, client);
      setEditArticle(updated);
      showFeedback("Статья опубликована");
      load();
    } catch (e) {
      showFeedback(messageFor(e), true);
    } finally {
      setSaving(false);
    }
  }

  async function requestPublishArticle(): Promise<void> {
    if (!editArticle || !canPublish) return;
    setPendingConfirm({
      title: a.t("admin.drawer.help.confirm.publishArticle.title"),
      description: a.t("admin.drawer.help.confirm.publishArticle.description").replace(
        "{name}",
        editArticle.titlePreview || editArticle.slug,
      ),
      action: publishArticleNow,
    });
  }

  async function archiveArticleNow() {
    if (!editArticle || !canPublish) return;
    setSaving(true);
    try {
      const updated = await archiveAdminHelpArticle(editArticle.id, client);
      setEditArticle(updated);
      showFeedback("Статья архивирована");
      load();
    } catch (e) {
      showFeedback(messageFor(e), true);
    } finally {
      setSaving(false);
    }
  }

  async function requestArchiveArticle(): Promise<void> {
    if (!editArticle || !canPublish) return;
    setPendingConfirm({
      title: a.t("admin.drawer.help.confirm.archiveArticle.title"),
      description: a.t("admin.drawer.help.confirm.archiveArticle.description").replace(
        "{name}",
        editArticle.titlePreview || editArticle.slug,
      ),
      action: archiveArticleNow,
    });
  }

  async function deleteArticleNow() {
    if (!editArticle || !canDelete) return;
    setSaving(true);
    try {
      await deleteAdminHelpArticle(editArticle.id, client);
      setArticleDrawerOpen(false);
      showFeedback("Статья удалена");
      load();
    } catch (e) {
      showFeedback(messageFor(e), true);
    } finally {
      setSaving(false);
    }
  }

  async function requestRemoveArticle(): Promise<void> {
    if (!editArticle || !canDelete) return;
    setPendingConfirm({
      title: a.t("admin.drawer.help.confirm.deleteArticle.title"),
      description: a.t("admin.drawer.help.confirm.deleteArticle.description").replace(
        "{name}",
        editArticle.titlePreview || editArticle.slug,
      ),
      variant: "destructive",
      action: deleteArticleNow,
    });
  }

  async function quickToggleCategoryPublish(row: AdminHelpCategory) {
    if (!canEditCategories) return;
    try {
      await updateAdminHelpCategory(row.id, { isPublished: !row.isPublished }, client);
      load();
    } catch (e) {
      showFeedback(messageFor(e), true);
    }
  }

  const categoryColumns: AdminColumn<AdminHelpCategory>[] = [
    {
      key: "sort",
      header: "#",
      render: (r) => <span className="tabular-nums text-xs text-zinc-500">{r.sortOrder}</span>,
    },
    {
      key: "title",
      header: "Название",
      render: (r) => (
        <div>
          <p className="font-medium text-zinc-100">{r.titlePreview || r.slug}</p>
          {r.icon ? <p className="text-[11px] text-zinc-400">{r.icon}</p> : null}
        </div>
      ),
    },
    {
      key: "slug",
      header: a.t("admin.helpCenter.field.slug"),
      render: (r) => <span className="font-mono text-xs">{r.slug}</span>,
    },
    {
      key: "parent",
      header: "Родитель",
      render: (r) => (
        <span className={cn("text-sm", !r.parentId ? "text-zinc-500" : "text-zinc-300")}>
          {parentLabel(categories, r.parentId)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (r) => (
        <AdminLocalizedStatusBadge
          status={r.isPublished ? "published" : "draft"}
          tone={r.isPublished ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "updated",
      header: "Обновлено",
      render: (r) => (
        <span className="text-xs text-zinc-500">{formatAdminDateShort(r.updatedAt)}</span>
      ),
    },
    ...(canEditCategories
      ? [
          {
            key: "actions",
            header: "",
            render: (r: AdminHelpCategory) => (
              <Button
                type="button"
                size="sm"
                variant="ghost" className={adminBtnOutline}
                onClick={(e) => {
                  e.stopPropagation();
                  void quickToggleCategoryPublish(r);
                }}
              >
                {r.isPublished ? "Скрыть" : "Показать"}
              </Button>
            ),
          } as AdminColumn<AdminHelpCategory>,
        ]
      : []),
  ];

  const articleColumns: AdminColumn<AdminHelpArticle>[] = [
    {
      key: "title",
      header: "Заголовок",
      render: (r) => (
        <div>
          <p className="font-medium">{r.titlePreview || r.slug}</p>
          <p className="font-mono text-[11px] text-zinc-400">{r.slug}</p>
        </div>
      ),
    },
    {
      key: "cat",
      header: "Категория",
      render: (r) => (
        <span className={cn("text-sm", !r.categoryId ? "text-zinc-500" : "text-zinc-300")}>
          {categoryLabel(categories, r.categoryId)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (r) => {
        const rowStatus = r.status?.trim();
        if (!rowStatus || rowStatus === "—") {
          return <span className="text-sm text-zinc-500">Не указан</span>;
        }
        return <AdminLocalizedStatusBadge status={rowStatus} />;
      },
    },
    {
      key: "flags",
      header: "Метки",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.isFeatured ? (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">F</span>
          ) : null}
          {r.isPopular ? (
            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">P</span>
          ) : null}
          {r.isGettingStarted ? (
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">GS</span>
          ) : null}
          {!r.isFeatured && !r.isPopular && !r.isGettingStarted ? (
            <span className="text-sm tabular-nums text-zinc-500">0</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "views",
      header: "Просмотры",
      render: (r) => <span className="tabular-nums text-xs">{r.viewCount}</span>,
    },
    {
      key: "updated",
      header: "Обновлено",
      render: (r) => (
        <span className="text-xs text-zinc-500">{formatAdminDateShort(r.updatedAt)}</span>
      ),
    },
  ];

  if (!canView) {
    return (
      <AdminSectionShell sectionId="helpCenter" title={a.adminSectionLabel("helpCenter")}>
        <AdminSectionPanel>
          <p className="py-8 text-center text-sm text-zinc-500">
            Недостаточно прав для просмотра Help Center.
          </p>
        </AdminSectionPanel>
      </AdminSectionShell>
    );
  }

  const readOnlyArticles = !canEditArticles;
  const readOnlyCategories = !canEditCategories;

  return (
    <AdminSectionShell
      sectionId="helpCenter"
      title={a.adminSectionLabel("helpCenter")}
      actions={<AdminSectionRefreshButton onClick={load} />}
    >
      {readOnlyCategories && !readOnlyArticles ? (
        <AdminReadOnlyBanner area="Категории Help Center" />
      ) : null}
      {readOnlyArticles && !readOnlyCategories ? (
        <AdminReadOnlyBanner area="Статьи Help Center" />
      ) : null}
      {readOnlyCategories && readOnlyArticles ? (
        <AdminReadOnlyBanner area="Help Center" />
      ) : null}

      <AdminSectionPanel>
        <AdminSectionTabBar
          tabs={helpTabs.map((t) => ({
            ...t,
            count: tabCounts[t.id],
          }))}
          activeId={tab}
          onChange={(id) => setTab(id as HelpTab)}
        />

        {feedback ? (
          <p
            className={`text-sm ${feedback.toLowerCase().includes("ошиб") || feedback.includes("Error") || feedback.includes("недостат") ? "text-red-600" : "text-zinc-400"}`}
          >
            {feedback}
          </p>
        ) : null}

        {tab === "overview" ? (
          <AdminSectionDataArea loading={loading} error={error} onRetry={load} loadingLabel="Загрузка Help Center…">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Категории", value: stats.categories, hint: `${stats.publishedCats} опубликовано` },
                { label: "Статьи", value: stats.articles, hint: `${stats.publishedArticles} live` },
                { label: "Черновики", value: stats.draftArticles, hint: `${stats.archivedArticles} в архиве` },
                {
                  label: a.t("admin.helpCenter.curated"),
                  value: stats.featured + stats.popular + stats.gettingStarted,
                  hint: `F ${stats.featured} · P ${stats.popular} · GS ${stats.gettingStarted}`,
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-2xl border border-neutral-200/80 bg-zinc-900/50 px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{k.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{k.value}</p>
                  <p className="mt-1 text-xs text-zinc-500">{k.hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-neutral-100 bg-zinc-900/80 p-4">
                <h3 className="text-sm font-semibold text-zinc-100">Последние черновики</h3>
                {articles.filter((a) => a.status === "draft").length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500">Нет черновиков. Создайте первую статью.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {articles
                      .filter((a) => a.status === "draft")
                      .slice(0, 5)
                      .map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-zinc-900/50"
                            onClick={() => openEditArticle(a)}
                          >
                            <span>{a.titlePreview || a.slug}</span>
                            <span className="text-xs text-zinc-500">{formatAdminDateShort(a.updatedAt)}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-zinc-900/80 p-4">
                <h3 className="text-sm font-semibold text-zinc-100">Категории</h3>
                {categories.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500">Категории ещё не созданы.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {categories.slice(0, 6).map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-sm">
                        <span>{c.titlePreview || c.slug}</span>
                        <AdminLocalizedStatusBadge
                          status={c.isPublished ? "published" : "draft"}
                          tone={c.isPublished ? "success" : "neutral"}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {canEditCategories ? (
                <Button type="button" onClick={openCreateCategory}>
                  Создать категорию
                </Button>
              ) : null}
              {canEditArticles ? (
                <Button type="button" variant="ghost" className={adminBtnOutline} onClick={openCreateArticle}>
                  Создать статью
                </Button>
              ) : null}
            </div>
          </AdminSectionDataArea>
        ) : null}

        {tab === "categories" ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              {canEditCategories ? (
                <Button type="button" onClick={openCreateCategory}>
                  Создать категорию
                </Button>
              ) : null}
            </div>
            <AdminFilterBar
              className="!mb-4 !rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
              fields={categoryFilterFields}
            />
            <p className="mb-3 text-xs text-zinc-500">
              {a.t("admin.helpCenter.filter.results")
                .replace("{shown}", String(filteredCategories.length))
                .replace("{total}", String(categories.length))}
            </p>
            <AdminSectionDataArea loading={loading} error={error} onRetry={load} loadingLabel="Загрузка категорий…">
              <AdminDataTable
                flat
                columns={categoryColumns}
                rows={filteredCategories}
                rowKey={(r) => r.id}
                onRowClick={openEditCategory}
                emptyMessage="Категории не созданы. Добавьте первую категорию для структуры Help Center."
              />
            </AdminSectionDataArea>
          </>
        ) : null}

        {tab === "articles" || tab === "popular" || tab === "getting-started" || tab === "drafts" ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              {canEditArticles ? (
                <Button type="button" onClick={openCreateArticle}>
                  Создать статью
                </Button>
              ) : null}
            </div>

            <AdminFilterBar
              className="!mb-3 !rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
              fields={articleFilterFields}
            />
            <p className="mb-3 text-xs text-zinc-500">
              {a.t("admin.helpCenter.filter.results")
                .replace("{shown}", String(filteredArticles.length))
                .replace("{total}", String(tabArticleTotal))}
            </p>

            <AdminSectionDataArea loading={loading} error={error} onRetry={load} loadingLabel="Загрузка статей…">
              <AdminDataTable
                flat
                columns={articleColumns}
                rows={filteredArticles}
                rowKey={(r) => r.id}
                onRowClick={openEditArticle}
                emptyMessage={
                  tab === "drafts"
                    ? "Нет черновиков"
                    : tab === "popular"
                      ? "Нет статей с меткой Popular"
                      : tab === "getting-started"
                        ? "Нет статей Getting Started"
                        : "Нет статей по выбранным фильтрам"
                }
              />
            </AdminSectionDataArea>
          </>
        ) : null}
      </AdminSectionPanel>

      <AdminHelpCategoryDrawer
        open={categoryDrawerOpen}
        onOpenChange={setCategoryDrawerOpen}
        category={editCategory}
        categories={categories}
        mode={categoryMode}
        saving={saving}
        readOnly={readOnlyCategories}
        onSubmit={persistCategory}
        onTogglePublish={canEditCategories ? requestToggleCategoryPublish : undefined}
        onDelete={canDelete ? requestRemoveCategory : undefined}
      />

      <AdminHelpArticleDrawer
        open={articleDrawerOpen}
        onOpenChange={setArticleDrawerOpen}
        article={editArticle}
        categories={categories}
        mode={articleMode}
        saving={saving}
        readOnly={readOnlyArticles}
        canPublish={canPublish}
        canDelete={canDelete}
        onSubmit={persistArticle}
        onPublish={canPublish ? requestPublishArticle : undefined}
        onArchive={canPublish ? requestArchiveArticle : undefined}
        onDelete={canDelete ? requestRemoveArticle : undefined}
      />

      <AdminConfirmDialog
        open={pendingConfirm != null}
        onOpenChange={(open) => {
          if (!open && !confirming) setPendingConfirm(null);
        }}
        title={pendingConfirm?.title ?? ""}
        description={pendingConfirm?.description ?? ""}
        variant={pendingConfirm?.variant}
        confirming={confirming}
        onConfirm={async () => {
          if (!pendingConfirm) return;
          setConfirming(true);
          try {
            await pendingConfirm.action();
            setPendingConfirm(null);
          } finally {
            setConfirming(false);
          }
        }}
      />
    </AdminSectionShell>
  );
}
