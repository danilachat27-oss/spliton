import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePrimaryOrderDto {
  @IsUUID()
  roundId!: string;

  @IsNumber()
  @IsPositive()
  @Min(0.00000001)
  @Max(1_000_000_000)
  units!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  idempotencyKey!: string;
}
