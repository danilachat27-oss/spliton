import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import type { TwoFactorVerifyMethod } from '../types/two-factor.types';

export class TwoFactorDisableDto {
  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  code!: string;

  @IsIn(['totp', 'backup_code'])
  method!: TwoFactorVerifyMethod;
}
