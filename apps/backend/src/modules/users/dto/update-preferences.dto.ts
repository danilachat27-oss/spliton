import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { AppLocale } from '@prisma/client';
import {
  normalizeAppLocale,
  SUPPORTED_APP_LOCALE_CODES,
} from '../../../common/i18n/app-locale';
import { IsIanaTimezone } from '../../../common/validators/is-iana-timezone.validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : normalizeAppLocale(String(value)),
  )
  @IsIn(SUPPORTED_APP_LOCALE_CODES)
  preferredLocale?: AppLocale;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  @IsIanaTimezone()
  timezone?: string;
}
