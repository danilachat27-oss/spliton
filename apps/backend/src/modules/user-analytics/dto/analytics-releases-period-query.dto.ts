import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ANALYTICS_RELEASES_PERIODS } from './analytics-releases-list-query.dto';

export class AnalyticsReleasesPeriodQueryDto {
  @IsOptional()
  @IsIn(ANALYTICS_RELEASES_PERIODS)
  period?: (typeof ANALYTICS_RELEASES_PERIODS)[number] = '30d';
}

export class AnalyticsReleasesCompareQueryDto extends AnalyticsReleasesPeriodQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;
}
