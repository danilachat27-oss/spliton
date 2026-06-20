import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const CATEGORIES = [
  'deposit',
  'withdrawal',
  'wallet',
  'primary_purchase',
  'secondary_market',
  'payouts',
  'account',
  'technical',
  'other',
] as const;

const RELATED_TYPES = [
  'deposit',
  'withdrawal',
  'wallet_transaction',
  'order',
  'listing',
  'trade',
  'revenue_distribution',
] as const;

export class CreateSupportTicketDto {
  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  message!: string;

  @IsOptional()
  @IsIn(RELATED_TYPES)
  relatedEntityType?: (typeof RELATED_TYPES)[number];

  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;
}
