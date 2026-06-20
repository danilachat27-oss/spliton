"use client";

import * as React from "react";

import {
  AdminDrawerCancelButton,
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { AdminDetailDrawer, AdminFormField, AdminFormFooter } from "@/features/admin/ui";
import { AdminLocalizedStatusBadge } from "@/features/admin/ui";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { fieldErrorMap, fieldErrorMessage } from "@/features/admin/lib/admin-form-field-errors";
import { adminFieldInput, adminFieldTextarea } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";
import type { AdminNewsPost } from "@/services/admin/adminNews.service";

export type AdminNewsFormBody = {
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  content: string;
  coverUrl: string;
  pinned: boolean;
  showOnHomepage: boolean;
  showInDashboard: boolean;
  audience: string;
  publishAt: string;
};

export const NEWS_CATEGORY_VALUES = [
  "platform",
  "updates",
  "finance",
  "releases",
  "market",
  "maintenance",
  "warning",
] as const;

export const NEWS_AUDIENCE_VALUES = ["all", "holders", "artists", "admins"] as const;

export function emptyNewsForm(): AdminNewsFormBody {
  return {
    title: "",
    slug: "",
    category: "platform",
    shortDescription: "",
    content: "",
    coverUrl: "",
    pinned: false,
    showOnHomepage: true,
    showInDashboard: true,
    audience: "all",
    publishAt: "",
  };
}

export function newsFormFromPost(post: AdminNewsPost): AdminNewsFormBody {
  return {
    title: post.title,
    slug: post.slug,
    category: post.category,
    shortDescription: post.shortDescription ?? "",
    content: post.content,
    coverUrl: post.coverUrl ?? "",
    pinned: post.pinned,
    showOnHomepage: post.showOnHomepage,
    showInDashboard: post.showInDashboard,
    audience: post.audience,
    publishAt: post.publishAt ? post.publishAt.slice(0, 16) : "",
  };
}

export function newsFormToPayload(form: AdminNewsFormBody): Record<string, unknown> {
  return {
    title: form.title.trim(),
    slug: form.slug.trim().toLowerCase(),
    category: form.category,
    shortDescription: form.shortDescription.trim() || null,
    content: form.content,
    coverUrl: form.coverUrl.trim() || null,
    audience: form.audience,
    pinned: form.pinned,
    showOnHomepage: form.showOnHomepage,
    showInDashboard: form.showInDashboard,
    publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : undefined,
  };
}

export function validateNewsForm(form: AdminNewsFormBody): string[] {
  const errors: string[] = [];
  if (!form.title.trim()) errors.push("admin.drawer.news.error.titleRequired");
  if (!form.slug.trim()) errors.push("admin.drawer.news.error.slugRequired");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim().toLowerCase())) {
    errors.push("admin.drawer.news.error.slugInvalid");
  }
  if (!form.content.trim()) errors.push("admin.drawer.news.error.contentRequired");
  return errors;
}

const NEWS_FIELD_ERRORS = {
  "admin.drawer.news.error.titleRequired": "title",
  "admin.drawer.news.error.slugRequired": "slug",
  "admin.drawer.news.error.slugInvalid": "slug",
  "admin.drawer.news.error.contentRequired": "content",
} as const;

type AdminNewsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: AdminNewsPost | null;
  mode: "create" | "edit";
  saving: boolean;
  loading?: boolean;
  coverUploading?: boolean;
  readOnly?: boolean;
  onSubmit: (body: AdminNewsFormBody) => Promise<void>;
  onPublish?: () => Promise<void>;
  onUnpublish?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onUploadCover?: (file: File) => Promise<void>;
};

export function AdminNewsDrawer({
  open,
  onOpenChange,
  post,
  mode,
  saving,
  loading,
  coverUploading,
  readOnly,
  onSubmit,
  onPublish,
  onUnpublish,
  onArchive,
  onUploadCover,
}: AdminNewsDrawerProps) {
  const a = useAdminI18n();
  const newsCategories = React.useMemo(
    () =>
      NEWS_CATEGORY_VALUES.map((value) => ({
        value,
        label: a.t(`admin.drawer.news.category.${value}`),
      })),
    [a],
  );
  const newsAudiences = React.useMemo(
    () =>
      NEWS_AUDIENCE_VALUES.map((value) => ({
        value,
        label: a.t(`admin.drawer.news.audience.${value}`),
      })),
    [a],
  );
  const [form, setForm] = React.useState<AdminNewsFormBody>(emptyNewsForm());
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && post) {
      setForm(newsFormFromPost(post));
    } else if (mode === "create") {
      setForm(emptyNewsForm());
    }
    setErrors([]);
  }, [open, mode, post]);

  const set = <K extends keyof AdminNewsFormBody>(key: K, value: AdminNewsFormBody[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSave() {
    const validation = validateNewsForm(form);
    setErrors(validation);
    if (validation.length) return;
    await onSubmit(form);
  }

  const fieldErrors = fieldErrorMap(errors, NEWS_FIELD_ERRORS);
  const fe = (field: "title" | "slug" | "content") => fieldErrorMessage(fieldErrors, field, a.t);

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? a.t("admin.drawer.news.createTitle") : a.t("admin.drawer.news.editTitle")}
      subtitle={post ? `${post.slug} · ${post.id.slice(0, 8)}…` : undefined}
      wide
      widthClassName="w-[min(720px,100vw)]"
      footer={
        <AdminFormFooter
          left={
            <div className="flex flex-wrap items-center gap-2">
              {post ? <AdminLocalizedStatusBadge status={post.status} /> : null}
              {!readOnly && post && post.status !== "published" && onPublish ? (
                <AdminDrawerSecondaryButton disabled={saving} onClick={() => void onPublish()}>
                  {a.t("admin.drawer.help.publish")}
                </AdminDrawerSecondaryButton>
              ) : null}
              {!readOnly && post && post.status === "published" && onUnpublish ? (
                <AdminDrawerSecondaryButton disabled={saving} onClick={() => void onUnpublish()}>
                  {a.t("admin.drawer.news.unpublish")}
                </AdminDrawerSecondaryButton>
              ) : null}
              {!readOnly && post && post.status !== "archived" && onArchive ? (
                <AdminDrawerSecondaryButton disabled={saving} onClick={() => void onArchive()}>
                  {a.t("admin.drawer.news.archive")}
                </AdminDrawerSecondaryButton>
              ) : null}
            </div>
          }
          right={
            <>
              <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>
                {a.t("admin.drawer.common.close")}
              </AdminDrawerGhostButton>
              {!readOnly ? (
                <AdminDrawerPrimaryButton disabled={saving || loading} onClick={() => void handleSave()}>
                  {saving ? a.t("admin.drawer.common.saving") : a.t("admin.drawer.help.save")}
                </AdminDrawerPrimaryButton>
              ) : null}
            </>
          }
        />
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">{a.t("admin.drawer.common.loading")}</p>
      ) : (
        <div className="space-y-5 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFormField
              label={a.t("admin.drawer.news.field.title")}
              htmlFor="news-title"
              error={fe("title")}
              className="sm:col-span-2"
            >
              <Input
                id="news-title"
                className={adminFieldInput}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                readOnly={readOnly}
                aria-invalid={Boolean(fe("title"))}
              />
            </AdminFormField>
            <AdminFormField label="Slug" htmlFor="news-slug" error={fe("slug")}>
              <Input
                id="news-slug"
                className={cn("font-mono text-sm", adminFieldInput)}
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                readOnly={readOnly}
                aria-invalid={Boolean(fe("slug"))}
              />
            </AdminFormField>
            <AdminStyledSelectField
              label={a.t("admin.drawer.news.field.category")}
              id="news-category"
              value={form.category}
              disabled={readOnly}
              options={newsCategories.map((c) => ({ value: c.value, label: c.label }))}
              onChange={(value) => set("category", value)}
            />
            <AdminFormField
              label={a.t("admin.drawer.news.field.shortDescription")}
              htmlFor="news-short"
              className="sm:col-span-2"
            >
              <Input
                id="news-short"
                className={adminFieldInput}
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                readOnly={readOnly}
              />
            </AdminFormField>
            <AdminFormField
              label={a.t("admin.drawer.news.field.content")}
              htmlFor="news-content"
              error={fe("content")}
              className="sm:col-span-2"
            >
              <textarea
                id="news-content"
                rows={10}
                className={adminFieldTextarea}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                readOnly={readOnly}
                aria-invalid={Boolean(fe("content"))}
              />
            </AdminFormField>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-50/50 p-4">
            <p className="text-sm font-medium text-zinc-100">{a.t("admin.drawer.news.field.cover")}</p>
            {mode === "edit" && onUploadCover && !readOnly ? (
              <AdminFormField
                label={a.t("admin.drawer.news.field.uploadImage")}
                htmlFor="news-cover-file"
                hint={a.t("admin.drawer.news.field.coverHint")}
                className="mt-3"
              >
                <Input
                  id="news-cover-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={adminFieldInput}
                  disabled={coverUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUploadCover(file);
                    e.target.value = "";
                  }}
                />
              </AdminFormField>
            ) : mode === "create" ? (
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                {a.t("admin.drawer.news.field.draftCoverHint")}
              </p>
            ) : null}
            <AdminFormField
              label={a.t("admin.drawer.news.field.coverUrl")}
              htmlFor="news-cover-url"
              className="mt-3"
            >
              <Input
                id="news-cover-url"
                className={adminFieldInput}
                value={form.coverUrl}
                onChange={(e) => set("coverUrl", e.target.value)}
                readOnly={readOnly}
                placeholder="https://…"
              />
            </AdminFormField>
            {form.coverUrl.trim() ? (
              <div className="mt-3 aspect-[16/9] max-w-sm overflow-hidden rounded-xl border border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverUrl.trim()} alt="" className="size-full object-cover" />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminStyledSelectField
              label={a.t("admin.drawer.news.field.audience")}
              id="news-audience"
              value={form.audience}
              disabled={readOnly}
              options={newsAudiences.map((item) => ({ value: item.value, label: item.label }))}
              onChange={(value) => set("audience", value)}
            />
            <AdminFormField label={a.t("admin.drawer.news.field.publishAt")} htmlFor="news-publish-at">
              <Input
                id="news-publish-at"
                type="datetime-local"
                className={adminFieldInput}
                value={form.publishAt}
                onChange={(e) => set("publishAt", e.target.value)}
                readOnly={readOnly}
              />
            </AdminFormField>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pinned}
                disabled={readOnly}
                onChange={(e) => set("pinned", e.target.checked)}
              />
              {a.t("admin.drawer.news.pinned")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showOnHomepage}
                disabled={readOnly}
                onChange={(e) => set("showOnHomepage", e.target.checked)}
              />
              {a.t("admin.drawer.news.showOnHomepage")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showInDashboard}
                disabled={readOnly}
                onChange={(e) => set("showInDashboard", e.target.checked)}
              />
              {a.t("admin.drawer.news.showInDashboard")}
            </label>
          </div>
        </div>
      )}
    </AdminDetailDrawer>
  );
}
