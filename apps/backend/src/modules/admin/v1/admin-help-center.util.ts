import { HelpArticleStatus } from '@prisma/client';

import {
  parseHelpTranslations,
  resolveLocalizedHelpText,
} from '../../help-center/help-content-locale.util';
import { DEFAULT_APP_LOCALE } from '../../../common/i18n/app-locale';

export function normalizeHelpSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function mergeTranslations(
  current: unknown,
  patch?: Record<string, string>,
): Record<string, string> {
  const base = parseHelpTranslations(current);
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(base)) {
    if (typeof value === 'string') merged[key] = value;
  }
  if (!patch) return merged;
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = value.trim();
  }
  return merged;
}

export function hasNonEmptyTranslation(translations: unknown): boolean {
  return Object.values(parseHelpTranslations(translations)).some(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
}

export function assertPublishableHelpArticle(article: {
  slug: string;
  categoryId: string | null;
  titleTranslations: unknown;
  contentTranslations: unknown;
}): void {
  if (!article.slug?.trim()) {
    throwPublishValidation('HELP_ARTICLE_SLUG_REQUIRED', 'Article slug is required');
  }
  if (!article.categoryId) {
    throwPublishValidation(
      'HELP_ARTICLE_CATEGORY_REQUIRED',
      'Article category is required before publishing',
    );
  }
  if (!hasNonEmptyTranslation(article.titleTranslations)) {
    throwPublishValidation(
      'HELP_ARTICLE_TITLE_REQUIRED',
      'Article title is required in at least one locale before publishing',
    );
  }
  if (!hasNonEmptyTranslation(article.contentTranslations)) {
    throwPublishValidation(
      'HELP_ARTICLE_CONTENT_REQUIRED',
      'Article content is required in at least one locale before publishing',
    );
  }
}

function throwPublishValidation(code: string, message: string): never {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  throw error;
}

export const HELP_ARTICLE_STATUS_API: Record<HelpArticleStatus, string> = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

export const API_HELP_ARTICLE_STATUS: Record<string, HelpArticleStatus> = {
  draft: HelpArticleStatus.DRAFT,
  published: HelpArticleStatus.PUBLISHED,
  archived: HelpArticleStatus.ARCHIVED,
};

export function previewHelpTranslation(
  translations: unknown,
  locale = DEFAULT_APP_LOCALE,
): string {
  return resolveLocalizedHelpText(translations, locale).text;
}
