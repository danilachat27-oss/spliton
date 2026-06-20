"use client";

import * as React from "react";
import { ExternalLink } from "@/lib/lucide";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { ROUTES } from "@/constants/routes";
import {
  AdminHelpTranslationBlock,
  emptyHelpLocaleFields,
  helpLocaleFieldsFromMap,
  helpLocaleFieldsToMap,
  type HelpLocaleFields,
} from "@/features/admin/components/admin-help-locale-editor";
import { AdminDetailDrawer, AdminFormField, AdminFormFooter } from "@/features/admin/ui";
import { AdminLocalizedStatusBadge } from "@/features/admin/ui";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { fieldErrorMap, fieldErrorMessage } from "@/features/admin/lib/admin-form-field-errors";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import type { AdminHelpArticle, AdminHelpCategory } from "@/services/admin/adminHelpCenter.service";
import type { AppLocale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

export type AdminHelpArticleForm = {
  slug: string;
  categoryId: string;
  sortOrder: number;
  isFeatured: boolean;
  isPopular: boolean;
  isGettingStarted: boolean;
  metaTitle: string;
  metaDescription: string;
  title: HelpLocaleFields;
  excerpt: HelpLocaleFields;
  content: HelpLocaleFields;
};

export function emptyHelpArticleForm(): AdminHelpArticleForm {
  return {
    slug: "",
    categoryId: "",
    sortOrder: 0,
    isFeatured: false,
    isPopular: false,
    isGettingStarted: false,
    metaTitle: "",
    metaDescription: "",
    title: emptyHelpLocaleFields(),
    excerpt: emptyHelpLocaleFields(),
    content: emptyHelpLocaleFields(),
  };
}

export function helpArticleFormFromRow(row: AdminHelpArticle): AdminHelpArticleForm {
  return {
    slug: row.slug,
    categoryId: row.categoryId,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
    isPopular: row.isPopular,
    isGettingStarted: row.isGettingStarted,
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
    title: helpLocaleFieldsFromMap(row.titleTranslations),
    excerpt: helpLocaleFieldsFromMap(row.excerptTranslations),
    content: helpLocaleFieldsFromMap(row.contentTranslations),
  };
}

export function helpArticleFormToPayload(form: AdminHelpArticleForm): Record<string, unknown> {
  return {
    slug: form.slug.trim().toLowerCase(),
    categoryId: form.categoryId,
    sortOrder: form.sortOrder,
    isFeatured: form.isFeatured,
    isPopular: form.isPopular,
    isGettingStarted: form.isGettingStarted,
    metaTitle: form.metaTitle.trim() || null,
    metaDescription: form.metaDescription.trim() || null,
    titleTranslations: helpLocaleFieldsToMap(form.title),
    excerptTranslations: helpLocaleFieldsToMap(form.excerpt),
    contentTranslations: helpLocaleFieldsToMap(form.content),
  };
}

export function validateHelpArticleForm(form: AdminHelpArticleForm): string[] {
  const errors: string[] = [];
  if (!form.slug.trim()) errors.push("admin.drawer.help.error.articleSlugRequired");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim().toLowerCase())) {
    errors.push("admin.drawer.help.error.slugInvalid");
  }
  if (!form.categoryId) errors.push("admin.drawer.help.error.categoryRequired");
  return errors;
}

const HELP_ARTICLE_FIELD_ERRORS = {
  "admin.drawer.help.error.articleSlugRequired": "slug",
  "admin.drawer.help.error.slugInvalid": "slug",
  "admin.drawer.help.error.categoryRequired": "categoryId",
} as const;

type AdminHelpArticleDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: AdminHelpArticle | null;
  categories: AdminHelpCategory[];
  mode: "create" | "edit";
  saving: boolean;
  readOnly?: boolean;
  canPublish?: boolean;
  canDelete?: boolean;
  onSubmit: (body: AdminHelpArticleForm) => Promise<void>;
  onPublish?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function AdminHelpArticleDrawer({
  open,
  onOpenChange,
  article,
  categories,
  mode,
  saving,
  readOnly,
  canPublish,
  canDelete,
  onSubmit,
  onPublish,
  onArchive,
  onDelete,
}: AdminHelpArticleDrawerProps) {
  const a = useAdminI18n();
  const [form, setForm] = React.useState<AdminHelpArticleForm>(emptyHelpArticleForm());
  const [errors, setErrors] = React.useState<string[]>([]);
  const [localeTab, setLocaleTab] = React.useState<AppLocale>("ru");
  const [panelTab, setPanelTab] = React.useState<"content" | "seo" | "preview">("content");

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && article) {
      setForm(helpArticleFormFromRow(article));
    } else {
      setForm(emptyHelpArticleForm());
    }
    setErrors([]);
    setLocaleTab("ru");
    setPanelTab("content");
  }, [open, mode, article]);

  const set = <K extends keyof AdminHelpArticleForm>(key: K, value: AdminHelpArticleForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateHelpArticleForm(form);
    setErrors(v);
    if (v.length) return;
    await onSubmit(form);
  }

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.titlePreview || c.slug} (${c.slug})`,
  }));

  const previewTitle =
    form.title[localeTab].trim() || form.title.ru || form.slug || a.t("admin.drawer.help.noTitle");
  const previewExcerpt = form.excerpt[localeTab].trim() || form.excerpt.ru;
  const previewContent = form.content[localeTab].trim() || form.content.ru;
  const fieldErrors = fieldErrorMap(errors, HELP_ARTICLE_FIELD_ERRORS);
  const fe = (field: "slug" | "categoryId") => fieldErrorMessage(fieldErrors, field, a.t);

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? a.t("admin.drawer.help.article.createTitle") : a.t("admin.drawer.help.article.editTitle")}
      subtitle={article ? article.slug : "Help Center CMS"}
      wide
      widthClassName="w-[min(760px,100vw)]"
      footer={
        readOnly ? null : (
          <AdminFormFooter
            left={
              <>
                {mode === "edit" && canDelete && onDelete ? (
                  <AdminDrawerDangerButton disabled={saving} onClick={() => void onDelete()}>
                    {a.t("admin.drawer.help.delete")}
                  </AdminDrawerDangerButton>
                ) : null}
                {mode === "edit" && canPublish && article?.status === "draft" && onPublish ? (
                  <AdminDrawerSecondaryButton disabled={saving} onClick={() => void onPublish()}>
                    {a.t("admin.drawer.help.publish")}
                  </AdminDrawerSecondaryButton>
                ) : null}
                {mode === "edit" && canPublish && article?.status === "published" && onArchive ? (
                  <AdminDrawerSecondaryButton disabled={saving} onClick={() => void onArchive()}>
                    {a.t("admin.drawer.help.archive")}
                  </AdminDrawerSecondaryButton>
                ) : null}
              </>
            }
            right={
              <>
                <AdminDrawerCancelButton onClick={() => onOpenChange(false)}>
                  {a.t("admin.drawer.common.cancel")}
                </AdminDrawerCancelButton>
                <AdminDrawerPrimaryButton type="submit" form="help-article-form" disabled={saving}>
                  {saving ? a.t("admin.drawer.common.saving") : a.t("admin.drawer.help.save")}
                </AdminDrawerPrimaryButton>
              </>
            }
          />
        )
      }
    >
      <form id="help-article-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-6 pb-4">
        {mode === "edit" && article ? (
          <div className="flex flex-wrap items-center gap-2">
            <AdminLocalizedStatusBadge status={article.status} />
            {article.isFeatured ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                Featured
              </span>
            ) : null}
            {article.isPopular ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-800">
                Popular
              </span>
            ) : null}
            {article.isGettingStarted ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-800">
                Getting started
              </span>
            ) : null}
            <span className="text-xs text-zinc-500 tabular-nums">
              {a.t("admin.drawer.help.views").replace("{count}", String(article.viewCount))}
            </span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField label="Slug" htmlFor="art-slug" error={fe("slug")} className="sm:col-span-2">
            <Input
              id="art-slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              readOnly={readOnly}
              placeholder="how-to-deposit"
              className={cn("font-mono text-sm", adminFieldInput)}
              aria-invalid={Boolean(fe("slug"))}
            />
          </AdminFormField>
          <AdminStyledSelectField
            label={a.t("admin.drawer.news.field.category")}
            className="sm:col-span-2"
            value={form.categoryId}
            onChange={(v) => set("categoryId", v)}
            disabled={readOnly}
            placeholder={a.t("admin.drawer.help.selectCategory")}
            options={categoryOptions}
            error={fe("categoryId")}
          />
          <AdminFormField label={a.t("admin.drawer.help.sortOrder")} htmlFor="art-sort">
            <Input
              id="art-sort"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              readOnly={readOnly}
              className={adminFieldInput}
            />
          </AdminFormField>
          <div className="flex flex-col justify-end gap-2 pb-1">
            {(
              [
                ["isFeatured", "Featured"],
                ["isPopular", "Popular"],
                ["isGettingStarted", "Getting started"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  disabled={readOnly}
                  className="size-4 rounded border-zinc-300"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
          {(
            [
              ["content", a.t("admin.drawer.help.tab.content")],
              ["seo", a.t("admin.drawer.help.tab.seo")],
              ["preview", a.t("admin.drawer.help.tab.preview")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPanelTab(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium",
                panelTab === id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400",
              )}
            >
              {label}
            </button>
          ))}
          {article?.status === "published" ? (
            <a
                  href={`${ROUTES.supportArticle(article.slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-100"
            >
              {a.t("admin.drawer.help.openOnSite")}
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>

        {panelTab === "content" ? (
          <AdminHelpTranslationBlock
            activeLocale={localeTab}
            onLocaleChange={setLocaleTab}
            title={form.title}
            excerpt={form.excerpt}
            content={form.content}
            onTitleChange={(loc, value) => set("title", { ...form.title, [loc]: value })}
            onExcerptChange={(loc, value) => set("excerpt", { ...form.excerpt, [loc]: value })}
            onContentChange={(loc, value) => set("content", { ...form.content, [loc]: value })}
            readOnly={readOnly}
          />
        ) : null}

        {panelTab === "seo" ? (
          <div className="space-y-4 rounded-2xl border border-neutral-100 bg-zinc-900/50/80 p-4">
            <AdminFormField label="Meta title" htmlFor="meta-title">
              <Input
                id="meta-title"
                value={form.metaTitle}
                onChange={(e) => set("metaTitle", e.target.value)}
                readOnly={readOnly}
                className={adminFieldInput}
              />
            </AdminFormField>
            <AdminFormField label="Meta description" htmlFor="meta-desc">
              <Input
                id="meta-desc"
                value={form.metaDescription}
                onChange={(e) => set("metaDescription", e.target.value)}
                readOnly={readOnly}
                className={adminFieldInput}
              />
            </AdminFormField>
          </div>
        ) : null}

        {panelTab === "preview" ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-950 p-6 text-neutral-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Preview · {localeTab.toUpperCase()}
            </p>
            <h2 className="mt-3 text-xl font-semibold">{previewTitle}</h2>
            {previewExcerpt ? (
              <p className="mt-2 text-sm text-zinc-500">{previewExcerpt}</p>
            ) : null}
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
              {previewContent || (
                <span className="text-zinc-500">{a.t("admin.drawer.help.noContent")}</span>
              )}
            </div>
          </div>
        ) : null}
      </form>
    </AdminDetailDrawer>
  );
}
