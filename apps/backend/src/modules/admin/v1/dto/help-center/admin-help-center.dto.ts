import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateHelpCategoryDto {
  @IsString()
  @MaxLength(128)
  slug!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsObject()
  titleTranslations?: Record<string, string>;

  @IsOptional()
  @IsObject()
  descriptionTranslations?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateHelpCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  slug?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsObject()
  titleTranslations?: Record<string, string>;

  @IsOptional()
  @IsObject()
  descriptionTranslations?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ReorderHelpCategoryItemDto {
  @IsUUID()
  id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

export class ReorderHelpCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderHelpCategoryItemDto)
  items!: ReorderHelpCategoryItemDto[];
}

export class CreateHelpArticleDto {
  @IsString()
  @MaxLength(128)
  slug!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsObject()
  titleTranslations?: Record<string, string>;

  @IsOptional()
  @IsObject()
  excerptTranslations?: Record<string, string>;

  @IsOptional()
  @IsObject()
  contentTranslations?: Record<string, string>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsBoolean()
  isGettingStarted?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  metaTitle?: string | null;

  @IsOptional()
  @IsString()
  metaDescription?: string | null;
}

export class UpdateHelpArticleDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  slug?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsObject()
  titleTranslations?: Record<string, string>;

  @IsOptional()
  @IsObject()
  excerptTranslations?: Record<string, string>;

  @IsOptional()
  @IsObject()
  contentTranslations?: Record<string, string>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsBoolean()
  isGettingStarted?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  metaTitle?: string | null;

  @IsOptional()
  @IsString()
  metaDescription?: string | null;
}

export class ReorderHelpArticleItemDto {
  @IsUUID()
  id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}

export class ReorderHelpArticlesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderHelpArticleItemDto)
  items!: ReorderHelpArticleItemDto[];
}

export class ListHelpArticlesAdminQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
