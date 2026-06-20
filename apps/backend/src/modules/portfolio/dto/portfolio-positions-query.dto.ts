import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const PORTFOLIO_POSITION_SORT_KEYS = [
  'value_desc',
  'value_asc',
  'units_desc',
  'units_asc',
  'newest',
  'updated',
  'payout_desc',
  'liquidity_desc',
  'share',
  'release',
  /** @deprecated use value_desc / value_asc */
  'value',
  /** @deprecated use units_desc / units_asc */
  'units',
  /** @deprecated use newest */
  'date',
] as const;

export type PortfolioPositionSortKey =
  (typeof PORTFOLIO_POSITION_SORT_KEYS)[number];

export const PORTFOLIO_POSITION_STATUSES = [
  'Active',
  'Open round',
  'Secondary',
  'Closed',
] as const;

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

export class PortfolioPositionsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsIn(PORTFOLIO_POSITION_STATUSES)
  status?: (typeof PORTFOLIO_POSITION_STATUSES)[number];

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  hasAvailableUnits?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  hasLockedUnits?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  hasPayouts?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  hasActiveListing?: boolean;

  @IsOptional()
  @IsIn(PORTFOLIO_POSITION_SORT_KEYS)
  sort?: PortfolioPositionSortKey = 'value_desc';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'desc';

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
}
