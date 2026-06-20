import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  CatalogFiltersQueryDto,
  CatalogListQueryDto,
  CatalogSearchSuggestionsQueryDto,
} from './dto/catalog-list-query.dto';
import { PublicCatalogService } from './public-catalog.service';

@Controller('api/v1/catalog')
export class PublicCatalogController {
  constructor(private readonly catalog: PublicCatalogService) {}

  @Get('releases')
  listReleases(@Query() query: CatalogListQueryDto) {
    return this.catalog.listReleases(query);
  }

  @Get('releases/:id/primary-round')
  async getPrimaryRound(@Param('id') id: string) {
    const detail = await this.catalog.getRelease(id);
    return detail.primaryRound;
  }

  @Get('releases/:id')
  getRelease(@Param('id') id: string) {
    return this.catalog.getRelease(id);
  }

  @Get('search/suggestions')
  searchSuggestions(@Query() query: CatalogSearchSuggestionsQueryDto) {
    return this.catalog.searchSuggestions(query.q, query.limit ?? 8);
  }

  @Get('filters')
  getFilters(@Query() query: CatalogFiltersQueryDto) {
    return this.catalog.getFilters(query);
  }

  @Get('genres')
  getGenres() {
    return this.catalog.getGenres();
  }

  @Get('stats')
  getStats() {
    return this.catalog.getStats();
  }

  @Get('artists')
  listArtists(@Query('search') search?: string) {
    return this.catalog.listArtists(search);
  }
}
