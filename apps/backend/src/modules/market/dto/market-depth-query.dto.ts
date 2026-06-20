import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class MarketDepthQueryDto {
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
  @IsUUID()
  marketId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0.01, 0.05, 0.1])
  tickSize?: number;
}
