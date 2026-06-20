import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const DISPUTE_API_TYPES = [
  'deposit_not_credited',
  'withdrawal_not_received',
  'trade_dispute',
  'receipt_document_issue',
  'account_security',
  'kyc_rejected',
  'payout_mismatch',
  'report_incorrect',
  'other',
] as const;

export type DisputeApiType = (typeof DISPUTE_API_TYPES)[number];

export class CreateDisputeDto {
  @IsIn(DISPUTE_API_TYPES)
  type!: DisputeApiType;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  relatedEntityType?: string;

  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;
}
