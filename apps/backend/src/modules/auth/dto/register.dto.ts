import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsBoolean()
  acceptedTerms!: boolean;

  @IsBoolean()
  acceptedPrivacy!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  referralCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  utmCampaign?: string;
}
