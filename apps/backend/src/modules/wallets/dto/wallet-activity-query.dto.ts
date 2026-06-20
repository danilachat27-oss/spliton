import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const WALLET_ACTIVITY_TYPES = [
  'deposit',
  'withdrawal',
  'primary_purchase',
  'secondary_buy',
  'secondary_sell',
  'payout',
  'fee',
  'refund',
  'trade_lock',
  'admin_adjustment',
] as const;

export type WalletActivityTypeFilter = (typeof WALLET_ACTIVITY_TYPES)[number];

export const WALLET_ACTIVITY_STATUSES = [
  'pending',
  'completed',
  'failed',
  'cancelled',
  'reversed',
  'processing',
] as const;

export const WALLET_ACTIVITY_PERIODS = [
  '7d',
  '30d',
  '90d',
  '180d',
  '1y',
  'all',
] as const;

export type WalletActivityPeriod = (typeof WALLET_ACTIVITY_PERIODS)[number];

export const WALLET_ACTIVITY_DIRECTIONS = ['in', 'out'] as const;

export const WALLET_ACTIVITY_SORT_KEYS = [
  'newest',
  'oldest',
  'amount_desc',
  'amount_asc',
] as const;

export const WALLET_ACTIVITY_KINDS = [
  'deposits',
  'buys',
  'sells',
  'transfers',
  'withdrawals',
  'payouts',
] as const;

export class WalletActivityQueryDto {
  @IsOptional()
  @IsIn(WALLET_ACTIVITY_PERIODS)
  period?: WalletActivityPeriod;

  @IsOptional()
  @IsIn(WALLET_ACTIVITY_TYPES)
  type?: WalletActivityTypeFilter;

  @IsOptional()
  @IsIn(WALLET_ACTIVITY_KINDS)
  kind?: (typeof WALLET_ACTIVITY_KINDS)[number];

  @IsOptional()
  @IsIn(WALLET_ACTIVITY_STATUSES)
  status?: (typeof WALLET_ACTIVITY_STATUSES)[number];

  @IsOptional()
  @IsIn(WALLET_ACTIVITY_DIRECTIONS)
  direction?: (typeof WALLET_ACTIVITY_DIRECTIONS)[number];

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountMax?: number;

  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @IsIn(WALLET_ACTIVITY_SORT_KEYS)
  sort?: (typeof WALLET_ACTIVITY_SORT_KEYS)[number] = 'newest';

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
  pageSize?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
