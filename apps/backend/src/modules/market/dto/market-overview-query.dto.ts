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

export class MarketOverviewQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  genre?: string;

  @IsOptional()
  @IsIn(['active', 'new', 'paused', 'closed'])
  status?: string;

  @IsOptional()
  @IsIn(['deep', 'mid', 'thin'])
  liquidity?: string;

  @IsOptional()
  @IsIn(['yield', 'payouts', 'activity', 'units'])
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: string;

  @IsOptional()
  @IsIn(['24h', '7d', '30d', '90d'])
  period?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['monthly', 'biweekly'])
  payoutFreq?: string;

  @IsOptional()
  @IsIn(['high', 'mid', 'low'])
  yield?: string;

  @IsOptional()
  @IsIn(['tight', 'wide'])
  availability?: string;

  @IsOptional()
  @IsIn([
    'all',
    'new',
    'yield',
    'stable',
    'demand',
    'secondary',
    'premium',
    'archive',
  ])
  category?: string;

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
