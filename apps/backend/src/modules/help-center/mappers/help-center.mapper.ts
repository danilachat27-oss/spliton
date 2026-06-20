import { AppLocale, HelpArticle, HelpCategory } from '@prisma/client';

import { resolveLocalizedHelpText } from '../help-content-locale.util';

type CategoryRow = Pick<
  HelpCategory,
  | 'id'
  | 'slug'
  | 'parentId'
  | 'titleTranslations'
  | 'descriptionTranslations'
  | 'icon'
  | 'sortOrder'
  | 'isPublished'
>;

type ArticleRow = Pick<
  HelpArticle,
  | 'id'
  | 'slug'
  | 'categoryId'
  | 'titleTranslations'
  | 'excerptTranslations'
  | 'contentTranslations'
  | 'status'
  | 'sortOrder'
  | 'isFeatured'
  | 'isPopular'
  | 'isGettingStarted'
  | 'viewCount'
  | 'publishedAt'
  | 'metaTitle'
  | 'metaDescription'
  | 'createdAt'
  | 'updatedAt'
>;

export type HelpCategoryPublicDto = {
  id: string;
  slug: string;
  parentId: string | null;
  title: string;
  description: string;
  icon: string | null;
  sortOrder: number;
};

export type HelpArticleSummaryPublicDto = {
  id: string;
  slug: string;
  categoryId: string | null;
  title: string;
  excerpt: string;
  sortOrder: number;
  isFeatured: boolean;
  isPopular: boolean;
  isGettingStarted: boolean;
  viewCount: number;
  publishedAt: string | null;
};

export type HelpBreadcrumbDto = {
  slug: string;
  title: string;
};

export type HelpArticleDetailPublicDto = HelpArticleSummaryPublicDto & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  category: HelpCategoryPublicDto | null;
  breadcrumbs: HelpBreadcrumbDto[];
};

export function mapHelpCategory(
  row: CategoryRow,
  locale: AppLocale,
): HelpCategoryPublicDto {
  const title = resolveLocalizedHelpText(row.titleTranslations, locale);
  const description = resolveLocalizedHelpText(
    row.descriptionTranslations,
    locale,
  );

  return {
    id: row.id,
    slug: row.slug,
    parentId: row.parentId,
    title: title.text,
    description: description.text,
    icon: row.icon,
    sortOrder: row.sortOrder,
  };
}

export function mapHelpArticleSummary(
  row: ArticleRow,
  locale: AppLocale,
): HelpArticleSummaryPublicDto {
  const title = resolveLocalizedHelpText(row.titleTranslations, locale);
  const excerpt = resolveLocalizedHelpText(row.excerptTranslations, locale);

  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.categoryId,
    title: title.text,
    excerpt: excerpt.text,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
    isPopular: row.isPopular,
    isGettingStarted: row.isGettingStarted,
    viewCount: row.viewCount,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

export function mapHelpArticleDetail(
  row: ArticleRow,
  locale: AppLocale,
  params: {
    category: HelpCategoryPublicDto | null;
    breadcrumbs: HelpBreadcrumbDto[];
  },
): HelpArticleDetailPublicDto {
  const summary = mapHelpArticleSummary(row, locale);
  const content = resolveLocalizedHelpText(row.contentTranslations, locale);

  return {
    ...summary,
    content: content.text,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    category: params.category,
    breadcrumbs: params.breadcrumbs,
  };
}
