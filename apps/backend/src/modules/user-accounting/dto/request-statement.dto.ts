import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class RequestStatementDto {
  @IsString()
  @MaxLength(64)
  kind!: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  dateTo?: string;
}
