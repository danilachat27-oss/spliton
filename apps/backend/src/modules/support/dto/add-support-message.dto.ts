import { IsString, MaxLength, MinLength } from 'class-validator';

export class AddSupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body!: string;
}
