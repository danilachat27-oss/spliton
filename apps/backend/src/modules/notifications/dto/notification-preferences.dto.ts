import { IsBoolean, IsOptional } from 'class-validator';

export class PatchNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailFinance?: boolean;

  @IsOptional()
  @IsBoolean()
  emailSecurity?: boolean;

  @IsOptional()
  @IsBoolean()
  emailMarket?: boolean;

  @IsOptional()
  @IsBoolean()
  emailSupport?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNews?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppFinance?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppMarket?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppSupport?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppNews?: boolean;
}
