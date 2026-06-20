import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HelpLocaleQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;
}
