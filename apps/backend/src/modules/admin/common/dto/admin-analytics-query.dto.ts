import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminAnalyticsQueryDto {
  @IsOptional()
  @IsIn(['24h', '7d', '30d', '90d', 'custom'])
  period?: '24h' | '7d' | '30d' | '90d' | 'custom';

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month';

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  trackId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** Users analytics: lifecycle segment filter key */
  @IsOptional()
  @IsString()
  segment?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  hasDeposit?: string;

  @IsOptional()
  @IsString()
  hasHoldings?: string;

  @IsOptional()
  @IsString()
  hasRisk?: string;

  /** Risk analytics: rule code filter (e.g. wd_velocity) */
  @IsOptional()
  @IsString()
  source?: string;

  /** Support analytics: assigned manager user id */
  @IsOptional()
  @IsString()
  managerId?: string;
}
