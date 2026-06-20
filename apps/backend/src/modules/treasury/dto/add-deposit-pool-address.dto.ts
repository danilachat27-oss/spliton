import { IsOptional, IsString } from 'class-validator';

export class AddDepositPoolAddressDto {
  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsString()
  network?: string;

  @IsString()
  reason!: string;
}
