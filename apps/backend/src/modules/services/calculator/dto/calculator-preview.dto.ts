import { IsIn, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CalculatorPreviewDto {
  @IsIn(['buy', 'sell', 'withdraw', 'payout'])
  scenario!: 'buy' | 'sell' | 'withdraw' | 'payout';

  @IsOptional()
  @IsIn(['usdt', 'units'])
  buyMode?: 'usdt' | 'units';

  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsNumberString()
  units?: string;

  @IsOptional()
  @IsNumberString()
  pricePerUnit?: string;

  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @IsNumberString()
  poolUsdt?: string;

  @IsOptional()
  @IsNumberString()
  totalUnits?: string;
}
