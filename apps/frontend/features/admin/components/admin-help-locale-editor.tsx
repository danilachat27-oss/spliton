"use client";

import * as React from "react";

import { LocaleFlag } from "@/components/i18n/locale-flag";
import { Input } from "@/components/ui/input";
import { LOCALE_OPTIONS, type AppLocale } from "@/lib/i18n/types";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminFormField } from "@/features/admin/ui/admin-form-field";
import { adminFieldInput, adminFieldTextarea } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export const HELP_CONTENT_LOCALES: AppLocale[] = ["ru", "en", "es", "pt"];

export type HelpLocaleFields = Record<AppLocale, string>;

export function emptyHelpLocaleFields(): HelpLocaleFields {
  return { ru: "", en: "", es: "", pt: "" };
}

export function helpLocaleFieldsFromMap(map: Record<string, string>): HelpLocaleFields {
  return {
    ru: map.ru ?? "",
    en: map.en ?? "",
    es: map.es ?? "",
    pt: map.pt ?? "",
  };
}

export function helpLocaleFieldsToMap(fields: HelpLocaleFields): Record<string, string> {
  const out: Record<string, string> = {};
  for (const loc of HELP_CONTENT_LOCALES) {
    const v = fields[loc].trim();
    if (v) out[loc] = v;
  }
  return out;
}

type AdminHelpLocaleEditorProps = {
  activeLocale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
  fields: HelpLocaleFields;
  onFieldChange: (locale: AppLocale, value: string) => void;
  titleLabel?: string;
  excerptLabel?: string;
  contentLabel?: string;
  showExcerpt?: boolean;
  showContent?: boolean;
  readOnly?: boolean;
  titleError?: string | null;
};

export function AdminHelpLocaleEditor({
  activeLocale,
  onLocaleChange,
  fields,
  onFieldChange,
  titleLabel,
  excerptLabel,
  contentLabel,
  showExcerpt,
  showContent,
  readOnly,
  titleError,
}: AdminHelpLocaleEditorProps) {
  const a = useAdminI18n();
  const resolvedTitleLabel = titleLabel ?? a.t("admin.drawer.help.locale.title");
  const resolvedExcerptLabel = excerptLabel ?? a.t("admin.drawer.help.locale.excerpt");
  const resolvedContentLabel = contentLabel ?? a.t("admin.drawer.help.locale.content");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={a.t("admin.drawer.help.locale.contentLanguage")}>
        {HELP_CONTENT_LOCALES.map((loc) => {
          const filled = Boolean(fields[loc].trim());
          return (
            <button
              key={loc}
              type="button"
              role="tab"
              aria-selected={activeLocale === loc}
              onClick={() => onLocaleChange(loc)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activeLocale === loc
                  ? "bg-neutral-900 text-white"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/80",
              )}
            >
              <LocaleFlag locale={loc} className="size-3.5 rounded-sm" />
              {LOCALE_OPTIONS.find((o) => o.code === loc)?.label ?? loc.toUpperCase()}
              {filled ? (
                <span className="size-1.5 rounded-full bg-emerald-400" aria-label={a.t("admin.drawer.help.locale.filled")} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <AdminFormField
          label={resolvedTitleLabel}
          htmlFor={`help-title-${activeLocale}`}
          error={titleError}
        >
          <Input
            id={`help-title-${activeLocale}`}
            value={fields[activeLocale]}
            onChange={(e) => onFieldChange(activeLocale, e.target.value)}
            readOnly={readOnly}
            placeholder={`${resolvedTitleLabel} (${activeLocale.toUpperCase()})`}
            className={adminFieldInput}
            aria-invalid={Boolean(titleError)}
          />
        </AdminFormField>

        {showExcerpt ? (
          <AdminFormField label={resolvedExcerptLabel} htmlFor={`help-excerpt-${activeLocale}`}>
            <textarea
              id={`help-excerpt-${activeLocale}`}
              value={fields[activeLocale]}
              onChange={(e) => onFieldChange(activeLocale, e.target.value)}
              readOnly={readOnly}
              rows={3}
              placeholder={`${resolvedExcerptLabel} (${activeLocale.toUpperCase()})`}
              className={cn(adminFieldTextarea, "resize-y")}
            />
          </AdminFormField>
        ) : null}

        {showContent ? (
          <AdminFormField label={resolvedContentLabel} htmlFor={`help-content-${activeLocale}`}>
            <textarea
              id={`help-content-${activeLocale}`}
              value={fields[activeLocale]}
              onChange={(e) => onFieldChange(activeLocale, e.target.value)}
              readOnly={readOnly}
              rows={12}
              placeholder={`${resolvedContentLabel} (${activeLocale.toUpperCase()})`}
              className={cn(adminFieldTextarea, "min-h-[200px] font-mono resize-y")}
            />
          </AdminFormField>
        ) : null}
      </div>
    </div>
  );
}

/** Separate title/excerpt/content maps with shared locale tabs */
type AdminHelpTranslationBlockProps = {
  activeLocale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
  title: HelpLocaleFields;
  excerpt?: HelpLocaleFields;
  content?: HelpLocaleFields;
  onTitleChange: (locale: AppLocale, value: string) => void;
  onExcerptChange?: (locale: AppLocale, value: string) => void;
  onContentChange?: (locale: AppLocale, value: string) => void;
  readOnly?: boolean;
  titleError?: string | null;
};

export function AdminHelpTranslationBlock({
  activeLocale,
  onLocaleChange,
  title,
  excerpt,
  content,
  onTitleChange,
  onExcerptChange,
  onContentChange,
  readOnly,
  titleError,
}: AdminHelpTranslationBlockProps) {
  const a = useAdminI18n();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={a.t("admin.drawer.help.locale.contentLanguage")}>
        {HELP_CONTENT_LOCALES.map((loc) => {
          const filled =
            Boolean(title[loc].trim()) ||
            Boolean(excerpt?.[loc]?.trim()) ||
            Boolean(content?.[loc]?.trim());
          return (
            <button
              key={loc}
              type="button"
              role="tab"
              aria-selected={activeLocale === loc}
              onClick={() => onLocaleChange(loc)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activeLocale === loc
                  ? "bg-neutral-900 text-white"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/80",
              )}
            >
              <LocaleFlag locale={loc} className="size-3.5 rounded-sm" />
              {loc.toUpperCase()}
              {filled ? (
                <span className="size-1.5 rounded-full bg-emerald-400" aria-label={a.t("admin.drawer.help.locale.filled")} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-100 bg-zinc-900/50/80 p-4">
        <AdminFormField
          label={a.t("admin.drawer.help.locale.title")}
          htmlFor={`article-title-${activeLocale}`}
          error={titleError}
        >
          <Input
            id={`article-title-${activeLocale}`}
            value={title[activeLocale]}
            onChange={(e) => onTitleChange(activeLocale, e.target.value)}
            readOnly={readOnly}
            className={adminFieldInput}
            aria-invalid={Boolean(titleError)}
          />
        </AdminFormField>
        {excerpt && onExcerptChange ? (
          <AdminFormField
            label={a.t("admin.drawer.help.locale.excerpt")}
            htmlFor={`article-excerpt-${activeLocale}`}
          >
            <textarea
              id={`article-excerpt-${activeLocale}`}
              value={excerpt[activeLocale]}
              onChange={(e) => onExcerptChange(activeLocale, e.target.value)}
              readOnly={readOnly}
              rows={2}
              className={cn(adminFieldTextarea, "resize-y")}
            />
          </AdminFormField>
        ) : null}
        {content && onContentChange ? (
          <AdminFormField
            label={a.t("admin.drawer.help.locale.content")}
            htmlFor={`article-content-${activeLocale}`}
          >
            <textarea
              id={`article-content-${activeLocale}`}
              value={content[activeLocale]}
              onChange={(e) => onContentChange(activeLocale, e.target.value)}
              readOnly={readOnly}
              rows={14}
              className={cn(adminFieldTextarea, "min-h-[220px] font-mono resize-y")}
            />
          </AdminFormField>
        ) : null}
      </div>
    </div>
  );
}
