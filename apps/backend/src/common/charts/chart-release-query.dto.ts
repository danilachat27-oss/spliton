import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { CHART_BUCKETS, CHART_PERIODS, type ChartBucket, type ChartPeriod } from './chart-period.util';

export class ChartReleaseQueryDto {
  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsIn(CHART_PERIODS)
  period?: ChartPeriod;

  @IsOptional()
  @IsIn(CHART_BUCKETS)
  bucket?: ChartBucket;
}
