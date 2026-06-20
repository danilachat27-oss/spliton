import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MarketOrderPreviewDto {
  @IsString()
  marketId!: string;

  @IsIn(['BUY', 'SELL', 'buy', 'sell'])
  side!: 'BUY' | 'SELL' | 'buy' | 'sell';

  @IsIn(['LIMIT', 'MARKET', 'limit', 'market'])
  type!: 'LIMIT' | 'MARKET' | 'limit' | 'market';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  units?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tickSize?: number;

  @IsOptional()
  @IsString()
  releaseId?: string;
}
