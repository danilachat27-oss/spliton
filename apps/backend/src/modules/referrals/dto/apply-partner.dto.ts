import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartnerType } from '@prisma/client';

export class ApplyPartnerDto {
  @IsEnum(PartnerType)
  partnerType!: PartnerType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  applicationNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  payoutMethod?: string;
}
