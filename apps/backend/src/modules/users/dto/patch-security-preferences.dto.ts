import { IsBoolean, IsOptional } from 'class-validator';

export class PatchSecurityPreferencesDto {
  @IsOptional()
  @IsBoolean()
  withdrawalEmailConfirmationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  withdrawalAddressWhitelistEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  suspiciousLoginAlertsEnabled?: boolean;
}
