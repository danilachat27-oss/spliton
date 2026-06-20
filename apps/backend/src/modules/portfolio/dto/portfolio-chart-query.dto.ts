import { IsIn, IsOptional } from 'class-validator';

export const PORTFOLIO_CHART_PERIODS = [
  '7d',
  '30d',
  '90d',
  '180d',
  '1y',
  'all',
] as const;

export class PortfolioChartQueryDto {
  @IsOptional()
  @IsIn(PORTFOLIO_CHART_PERIODS)
  period?: (typeof PORTFOLIO_CHART_PERIODS)[number];
}
