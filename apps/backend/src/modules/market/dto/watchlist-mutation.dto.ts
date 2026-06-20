import { IsUUID } from 'class-validator';

export class WatchlistMutationDto {
  @IsUUID()
  releaseId!: string;
}
