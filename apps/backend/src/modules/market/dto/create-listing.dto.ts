import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateListingDto {
  @IsUUID()
  releaseId!: string;

  @IsNumber()
  @IsPositive()
  @Min(0.00000001)
  @Max(1_000_000_000)
  units!: number;

  @IsNumber()
  @IsPositive()
  pricePerUnit!: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
