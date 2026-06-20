import {
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWithdrawalDto {
  @IsNumberString()
  @Matches(/^\d+(\.\d{1,8})?$/, {
    message: 'amount must be a positive decimal',
  })
  amount!: string;

  @IsString()
  @MinLength(34)
  toAddress!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;
}
