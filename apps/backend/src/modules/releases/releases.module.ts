import { Module } from '@nestjs/common';
import { ReleasesController } from './releases.controller';
import { ReleasesRepository } from './releases.repository';
import { ReleasesService } from './releases.service';

@Module({
  controllers: [ReleasesController],
  providers: [ReleasesService, ReleasesRepository],
})
export class ReleasesModule {}
