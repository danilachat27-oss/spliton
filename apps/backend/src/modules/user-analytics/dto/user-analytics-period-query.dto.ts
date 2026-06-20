import { IsIn, IsOptional } from 'class-validator';

export const USER_ANALYTICS_PERIODS = [
  '7d',
  '30d',
  '90d',
  'ytd',
  'all',
] as const;

export type UserAnalyticsPeriod = (typeof USER_ANALYTICS_PERIODS)[number];

export class UserAnalyticsPeriodQueryDto {
  @IsOptional()
  @IsIn(USER_ANALYTICS_PERIODS)
  period?: UserAnalyticsPeriod = '30d';
}
