import { Injectable } from '@nestjs/common';
import { PublicCatalogService } from '../catalog/public-catalog.service';

@Injectable()
export class ReleasesService {
  constructor(private readonly publicCatalog: PublicCatalogService) {}

  findAll() {
    return this.publicCatalog.listLegacyReleases();
  }
}
