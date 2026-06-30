import { IsArray, IsOptional, IsString, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class BulkAddDepositPoolAddressesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsString({ each: true })
  addresses!: string[];

  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsString()
  network?: string;

  @IsString()
  reason!: string;
}
