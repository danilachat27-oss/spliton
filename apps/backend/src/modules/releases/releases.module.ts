import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { ReleasesController } from './releases.controller';
import { ReleasesRepository } from './releases.repository';
import { ReleasesService } from './releases.service';

@Module({
  imports: [CatalogModule],
  controllers: [ReleasesController],
  providers: [ReleasesService, ReleasesRepository],
})
export class ReleasesModule {}
