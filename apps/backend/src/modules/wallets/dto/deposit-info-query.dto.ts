import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { AppLocale } from '@prisma/client';
import {
  normalizeDepositLang,
  SUPPORTED_APP_LOCALE_CODES,
} from '../../../common/i18n/app-locale';

export class DepositInfoQueryDto {
  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : normalizeDepositLang(String(value)),
  )
  @IsIn(SUPPORTED_APP_LOCALE_CODES)
  lang?: AppLocale;
}
