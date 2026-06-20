import { IsNumber, IsOptional, IsPositive, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FeePreviewQueryDto {
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(0.00000001)
  @Max(1_000_000_000)
  units?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pricePerUnit?: number;
}
