import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyReferralCodeDto {
  @IsString()
  @MaxLength(32)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  utmCampaign?: string;
}
