import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';

import { HelpLocaleQueryDto } from './dto/help-locale-query.dto';
import { ListHelpArticlesQueryDto } from './dto/list-help-articles-query.dto';
import { PublicHelpCenterService } from './public-help-center.service';

@Controller('api/v1/help')
export class PublicHelpCenterController {
  constructor(private readonly helpCenter: PublicHelpCenterService) {}

  @Get('categories')
  listCategories(@Query() query: HelpLocaleQueryDto) {
    return this.helpCenter.listCategories(query.locale);
  }

  @Get('categories/:slug')
  async getCategoryBySlug(
    @Param('slug') slug: string,
    @Query() query: HelpLocaleQueryDto,
  ) {
    const result = await this.helpCenter.getCategoryBySlug(slug, query.locale);
    if ('error' in result) {
      throw new NotFoundException({ error: result.error });
    }
    return result;
  }

  @Get('articles')
  listArticles(@Query() query: ListHelpArticlesQueryDto) {
    return this.helpCenter.listArticles(query);
  }

  @Get('articles/:slug')
  async getArticleBySlug(
    @Param('slug') slug: string,
    @Query() query: HelpLocaleQueryDto,
  ) {
    const result = await this.helpCenter.getArticleBySlug(slug, query.locale);
    if ('error' in result) {
      throw new NotFoundException({ error: result.error });
    }
    return result;
  }
}
