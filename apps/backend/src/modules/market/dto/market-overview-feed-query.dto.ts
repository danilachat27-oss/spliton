import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const MARKET_OVERVIEW_FEED_PERIODS = [
  '24h',
  '7d',
  '30d',
  '90d',
  '1y',
  'all',
] as const;

export class MarketOverviewFeedQueryDto {
  @IsOptional()
  @IsIn(MARKET_OVERVIEW_FEED_PERIODS)
  period?: (typeof MARKET_OVERVIEW_FEED_PERIODS)[number] = '7d';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  genre?: string;

  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Alias for limit */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class MarketOverviewTopReleasesQueryDto extends MarketOverviewFeedQueryDto {
  @IsOptional()
  @IsIn(['volume', 'trades', 'listings', 'liquidity'])
  sort?: 'volume' | 'trades' | 'listings' | 'liquidity' = 'volume';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;
}
