import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { TwoFactorVerifyMethod } from '../types/two-factor.types';

export class TwoFactorVerifyDto {
  @IsUUID()
  challengeId!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  code!: string;

  @IsIn(['totp', 'backup_code'])
  method!: TwoFactorVerifyMethod;
}
