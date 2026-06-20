import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../../common/pagination/pagination.constants';

export const CATALOG_SORT_KEYS = [
  'relevance',
  'newest',
  'catalog_order',
  'title_asc',
  'progress_desc',
  'popularity',
  'yield',
  'yield_desc',
  'expected_yield_desc',
  'liquidity',
  'liquidity_desc',
  'volume24h',
  'volume24h_desc',
  'volume7d',
  'volume7d_desc',
  'price_asc',
  'price_desc',
  'available_units',
  'recently_traded',
  'closing_soon',
] as const;

export type CatalogSortKey = (typeof CATALOG_SORT_KEYS)[number];

export const CATALOG_KIND_KEYS = [
  'all',
  'primary',
  'funding',
  'secondary',
  'payouts',
  'coming_soon',
] as const;

export type CatalogKindKey = (typeof CATALOG_KIND_KEYS)[number];

export const CATALOG_STATUS_KEYS = [
  'open',
  'coming_soon',
  'sold_out',
  'payouts',
] as const;

export class CatalogListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number = DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(CATALOG_KIND_KEYS)
  kind?: CatalogKindKey;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  artistId?: string;

  @IsOptional()
  @IsIn(['live', 'paused', 'completed', 'none', 'all'])
  roundStatus?: string;

  @IsOptional()
  @IsIn(CATALOG_STATUS_KEYS)
  status?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  secondaryEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minYield?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minProgress?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minLiquidity?: number;

  @IsOptional()
  @IsIn(CATALOG_SORT_KEYS)
  sort?: CatalogSortKey;
}

export class CatalogSearchSuggestionsQueryDto {
  @IsString()
  @MaxLength(120)
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class CatalogFiltersQueryDto {
  @IsOptional()
  @IsIn(CATALOG_KIND_KEYS)
  kind?: CatalogKindKey;
}
