import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ANALYTICS_RELEASES_PERIODS = ['7d', '30d', '90d', 'all'] as const;
export type AnalyticsReleasesPeriod =
  (typeof ANALYTICS_RELEASES_PERIODS)[number];

export const ANALYTICS_RELEASES_SORT_KEYS = [
  'yield_desc',
  'yield_asc',
  'payouts_desc',
  'payouts_asc',
  'units_desc',
  'units_asc',
  'liquidity_desc',
  'progress_desc',
  'raised_desc',
  'holders_desc',
] as const;

export class AnalyticsReleasesListQueryDto {
  @IsOptional()
  @IsIn(ANALYTICS_RELEASES_PERIODS)
  period?: AnalyticsReleasesPeriod = '30d';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['all', 'Active', 'Paused', 'Closed', 'active', 'paused', 'closed'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  genre?: string;

  @IsOptional()
  @IsIn(['all', 'top', 'stable', 'growth'])
  preset?: string;

  @IsOptional()
  @IsIn(ANALYTICS_RELEASES_SORT_KEYS)
  sort?: string = 'yield_desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class AnalyticsReleasesOverviewQueryDto {
  @IsOptional()
  @IsIn(ANALYTICS_RELEASES_PERIODS)
  period?: AnalyticsReleasesPeriod = '30d';
}
