import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';

import { PaginatedQueryDto } from '../../common/pagination/paginated-query.dto';

import { PublicNewsService } from './public-news.service';

@Controller('api/v1/news')
export class PublicNewsController {
  constructor(private readonly news: PublicNewsService) {}

  @Get()
  list(@Query() query: PaginatedQueryDto) {
    return this.news.list(query.page, query.pageSize);
  }

  @Get(':slug')
  async bySlug(@Param('slug') slug: string) {
    const result = await this.news.bySlug(slug);
    if ('error' in result) {
      throw new NotFoundException({ error: result.error });
    }
    return result;
  }
}
