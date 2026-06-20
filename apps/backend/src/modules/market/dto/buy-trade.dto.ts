import { IsUUID } from 'class-validator';

export class BuyTradeDto {
  @IsUUID()
  listingId!: string;
}
