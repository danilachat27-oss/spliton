import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { PaginatedQueryDto } from '../../../common/pagination/paginated-query.dto';

export const MARKET_LISTING_STATUS_FILTERS = [
  'all',
  'active',
  'purchasable',
  'paused',
  'sold_out',
  'cancelled',
  'expired',
] as const;

export const MARKET_LISTING_GENRE_FILTERS = [
  'electronic',
  'pop',
  'hiphop',
  'rock',
] as const;

export const MARKET_LISTING_LIQUIDITY_FILTERS = ['high', 'med', 'low'] as const;

export const MARKET_LISTING_SORT_KEYS = [
  'newest',
  'price_asc',
  'price_desc',
  'units_desc',
  'change_desc',
  'availability',
] as const;

export type MarketListingStatusFilter =
  (typeof MARKET_LISTING_STATUS_FILTERS)[number];
export type MarketListingSortKey = (typeof MARKET_LISTING_SORT_KEYS)[number];

export class MarketListingsQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(MARKET_LISTING_STATUS_FILTERS)
  status?: MarketListingStatusFilter = 'purchasable';

  @IsOptional()
  @IsIn([...MARKET_LISTING_GENRE_FILTERS, 'all'])
  genre?: (typeof MARKET_LISTING_GENRE_FILTERS)[number] | 'all';

  @IsOptional()
  @IsIn(MARKET_LISTING_LIQUIDITY_FILTERS)
  liquidity?: (typeof MARKET_LISTING_LIQUIDITY_FILTERS)[number];

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
  yieldMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yieldMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitsMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitsMax?: number;

  @IsOptional()
  @IsIn(MARKET_LISTING_SORT_KEYS)
  sort?: MarketListingSortKey = 'availability';

  /** Alias for pageSize (frontend limit). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
