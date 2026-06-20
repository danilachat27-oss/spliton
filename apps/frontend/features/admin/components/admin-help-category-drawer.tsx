"use client";

import * as React from "react";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import {
  AdminHelpLocaleEditor,
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
import { cn } from "@/lib/utils";
import type { AdminHelpCategory } from "@/services/admin/adminHelpCenter.service";
import type { AppLocale } from "@/lib/i18n/types";

export type AdminHelpCategoryForm = {
  slug: string;
  parentId: string;
  icon: string;
  sortOrder: number;
  isPublished: boolean;
  title: HelpLocaleFields;
  description: HelpLocaleFields;
};

export function emptyHelpCategoryForm(): AdminHelpCategoryForm {
  return {
    slug: "",
    parentId: "",
    icon: "",
    sortOrder: 0,
    isPublished: false,
    title: emptyHelpLocaleFields(),
    description: emptyHelpLocaleFields(),
  };
}

export function helpCategoryFormFromRow(row: AdminHelpCategory): AdminHelpCategoryForm {
  return {
    slug: row.slug,
    parentId: row.parentId ?? "",
    icon: row.icon ?? "",
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    title: helpLocaleFieldsFromMap(row.titleTranslations),
    description: helpLocaleFieldsFromMap(row.descriptionTranslations),
  };
}

export function helpCategoryFormToPayload(form: AdminHelpCategoryForm): Record<string, unknown> {
  return {
    slug: form.slug.trim().toLowerCase(),
    parentId: form.parentId.trim() || null,
    icon: form.icon.trim() || null,
    sortOrder: form.sortOrder,
    isPublished: form.isPublished,
    titleTranslations: helpLocaleFieldsToMap(form.title),
    descriptionTranslations: helpLocaleFieldsToMap(form.description),
  };
}

export function validateHelpCategoryForm(form: AdminHelpCategoryForm): string[] {
  const errors: string[] = [];
  if (!form.slug.trim()) errors.push("admin.drawer.help.error.categorySlugRequired");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim().toLowerCase())) {
    errors.push("admin.drawer.help.error.slugInvalid");
  }
  const hasTitle = Object.values(form.title).some((v) => v.trim());
  if (!hasTitle) errors.push("admin.drawer.help.error.titleRequired");
  return errors;
}

const HELP_CATEGORY_FIELD_ERRORS = {
  "admin.drawer.help.error.categorySlugRequired": "slug",
  "admin.drawer.help.error.slugInvalid": "slug",
  "admin.drawer.help.error.titleRequired": "title",
} as const;

type AdminHelpCategoryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminHelpCategory | null;
  categories: AdminHelpCategory[];
  mode: "create" | "edit";
  saving: boolean;
  readOnly?: boolean;
  onSubmit: (body: AdminHelpCategoryForm) => Promise<void>;
  onTogglePublish?: (published: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function AdminHelpCategoryDrawer({
  open,
  onOpenChange,
  category,
  categories,
  mode,
  saving,
  readOnly,
  onSubmit,
  onTogglePublish,
  onDelete,
}: AdminHelpCategoryDrawerProps) {
  const a = useAdminI18n();
  const [form, setForm] = React.useState<AdminHelpCategoryForm>(emptyHelpCategoryForm());
  const [errors, setErrors] = React.useState<string[]>([]);
  const [localeTab, setLocaleTab] = React.useState<AppLocale>("ru");
  const [fieldTab, setFieldTab] = React.useState<"title" | "description">("title");

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && category) {
      setForm(helpCategoryFormFromRow(category));
    } else {
      setForm(emptyHelpCategoryForm());
    }
    setErrors([]);
    setLocaleTab("ru");
    setFieldTab("title");
  }, [open, mode, category]);

  const parentOptions = categories
    .filter((c) => c.id !== category?.id)
    .map((c) => ({ value: c.id, label: `${c.titlePreview || c.slug} (${c.slug})` }));

  const set = <K extends keyof AdminHelpCategoryForm>(key: K, value: AdminHelpCategoryForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateHelpCategoryForm(form);
    setErrors(v);
    if (v.length) return;
    await onSubmit(form);
  }

  const activeFields = fieldTab === "title" ? form.title : form.description;
  const fieldErrors = fieldErrorMap(errors, HELP_CATEGORY_FIELD_ERRORS);
  const fe = (field: "slug" | "title") => fieldErrorMessage(fieldErrors, field, a.t);

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? a.t("admin.drawer.help.category.createTitle") : a.t("admin.drawer.help.category.editTitle")}
      subtitle={category ? category.slug : "Help Center CMS"}
      wide
      widthClassName="w-[min(640px,100vw)]"
      footer={
        readOnly ? null : (
          <AdminFormFooter
            left={
              <>
                {mode === "edit" && onDelete ? (
                  <AdminDrawerDangerButton disabled={saving} onClick={() => void onDelete()}>
                    {a.t("admin.drawer.help.delete")}
                  </AdminDrawerDangerButton>
                ) : null}
                {mode === "edit" && onTogglePublish ? (
                  <AdminDrawerSecondaryButton
                    disabled={saving}
                    onClick={() => void onTogglePublish(!form.isPublished)}
                  >
                    {form.isPublished ? a.t("admin.drawer.help.hide") : a.t("admin.drawer.help.publish")}
                  </AdminDrawerSecondaryButton>
                ) : null}
              </>
            }
            right={
              <>
                <AdminDrawerCancelButton onClick={() => onOpenChange(false)}>
                  {a.t("admin.drawer.common.cancel")}
                </AdminDrawerCancelButton>
                <AdminDrawerPrimaryButton type="submit" form="help-category-form" disabled={saving}>
                  {saving ? a.t("admin.drawer.common.saving") : a.t("admin.drawer.help.save")}
                </AdminDrawerPrimaryButton>
              </>
            }
          />
        )
      }
    >
      <form id="help-category-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-6 pb-4">
        {mode === "edit" && category ? (
          <div className="flex items-center gap-2">
            <AdminLocalizedStatusBadge
              status={form.isPublished ? "published" : "draft"}
              tone={form.isPublished ? "success" : "neutral"}
            />
            <span className="text-xs text-zinc-500">
              {a.t("admin.drawer.help.updated").replace("{date}", category.updatedAt.slice(0, 16).replace("T", " "))}
            </span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField
            label="Slug"
            htmlFor="cat-slug"
            error={fe("slug")}
            className="sm:col-span-2"
          >
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              readOnly={readOnly}
              placeholder="getting-started"
              className={cn("font-mono text-sm", adminFieldInput)}
              aria-invalid={Boolean(fe("slug"))}
            />
          </AdminFormField>
          <AdminFormField label={a.t("admin.drawer.help.sortOrder")} htmlFor="cat-sort">
            <Input
              id="cat-sort"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              readOnly={readOnly}
              className={adminFieldInput}
            />
          </AdminFormField>
          <AdminFormField label={a.t("admin.drawer.help.icon")} htmlFor="cat-icon" hint="book-open, wallet…">
            <Input
              id="cat-icon"
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
              readOnly={readOnly}
              placeholder="book-open, wallet…"
              className={adminFieldInput}
            />
          </AdminFormField>
          <AdminStyledSelectField
            label={a.t("admin.drawer.help.parentCategory")}
            className="sm:col-span-2"
            value={form.parentId}
            onChange={(v) => set("parentId", v)}
            disabled={readOnly}
            placeholder={a.t("admin.drawer.help.rootCategory")}
            options={[{ value: "", label: a.t("admin.drawer.help.rootOption") }, ...parentOptions]}
          />
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            {(["title", "description"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFieldTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  fieldTab === tab ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {tab === "title" ? a.t("admin.drawer.help.tab.title") : a.t("admin.drawer.help.tab.description")}
              </button>
            ))}
          </div>
          <AdminHelpLocaleEditor
            activeLocale={localeTab}
            onLocaleChange={setLocaleTab}
            fields={activeFields}
            titleError={fieldTab === "title" ? fe("title") : null}
            onFieldChange={(loc, value) => {
              if (fieldTab === "title") {
                set("title", { ...form.title, [loc]: value });
              } else {
                set("description", { ...form.description, [loc]: value });
              }
            }}
            titleLabel={
              fieldTab === "title" ? a.t("admin.drawer.help.tab.title") : a.t("admin.drawer.help.tab.description")
            }
            readOnly={readOnly}
          />
        </div>

        {!readOnly ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
              className="size-4 rounded border-zinc-300"
            />
            {a.t("admin.drawer.help.publishedHint")}
          </label>
        ) : null}
      </form>
    </AdminDetailDrawer>
  );
}
