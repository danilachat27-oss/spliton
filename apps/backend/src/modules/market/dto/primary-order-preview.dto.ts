import { IsNumber, IsPositive, IsUUID, Max, Min } from 'class-validator';

export class PrimaryOrderPreviewDto {
  @IsUUID()
  roundId!: string;

  @IsNumber()
  @IsPositive()
  @Min(0.00000001)
  @Max(1_000_000_000)
  units!: number;
}
