import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PriceBucket } from '@prisma/client';

export class MarketPricesQueryDto {
  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsEnum(PriceBucket)
  bucket?: PriceBucket;

  @IsOptional()
  @IsString()
  period?: '7d' | '30d' | '90d' | '1y';
}
