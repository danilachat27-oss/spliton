import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class AdminTrackMutationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  artist?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  genre?: string;

  @IsOptional()
  @IsIn(['single', 'ep', 'album'])
  releaseType?: string;

  @IsOptional()
  @IsString()
  releaseDate?: string;

  @IsOptional()
  @IsIn([
    'draft',
    'review',
    'published',
    'active',
    'paused',
    'completed',
    'archived',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  riskDisclosureText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  legalDisclaimer?: string;

  @IsOptional()
  secondaryEnabled?: boolean;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  coverUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  audioPreviewUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  labelName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  copyrightOwner?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  isrc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  upc?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  spotifyUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  appleMusicUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  youtubeUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  yandexMusicUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  holderSharePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  artistSharePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  platformSharePct?: number;

  /** @deprecated use holderSharePct */
  @IsOptional()
  @IsNumber()
  revenueSharePoolPct?: number;

  /** @deprecated use platformSharePct */
  @IsOptional()
  @IsNumber()
  distributionSharePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  availableUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  primaryUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPurchaseUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  raiseTargetUsdt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hardCapUsdt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  promoBudgetUsdt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  artistUpfrontUsdt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  platformUpfrontUsdt?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  distributionNotes?: string;
}
