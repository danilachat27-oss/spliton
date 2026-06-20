import { IsIn, IsOptional } from 'class-validator';

export const PAYOUT_COMPARE_WINDOWS = ['7d', '30d', '90d'] as const;
export type PayoutCompareWindow = (typeof PAYOUT_COMPARE_WINDOWS)[number];

export class PortfolioPayoutsCompareQueryDto {
  @IsOptional()
  @IsIn(PAYOUT_COMPARE_WINDOWS)
  window?: PayoutCompareWindow = '30d';
}
