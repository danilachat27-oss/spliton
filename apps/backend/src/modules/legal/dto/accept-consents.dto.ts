import { ConsentSource } from '@prisma/client';
import { IsArray, IsEnum, IsUUID, ArrayMinSize } from 'class-validator';

export class AcceptConsentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  policyIds!: string[];

  @IsEnum(ConsentSource)
  source!: ConsentSource;
}
