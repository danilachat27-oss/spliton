import { IsOptional, IsString } from 'class-validator';

export class BuyListingDto {
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
