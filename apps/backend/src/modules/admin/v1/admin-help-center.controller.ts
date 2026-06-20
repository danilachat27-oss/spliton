import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { requestMeta } from '../common/admin-http.util';
import { AdminHelpCenterService } from './admin-help-center.service';
import {
  CreateHelpArticleDto,
  CreateHelpCategoryDto,
  ListHelpArticlesAdminQueryDto,
  ReorderHelpArticlesDto,
  ReorderHelpCategoriesDto,
  UpdateHelpArticleDto,
  UpdateHelpCategoryDto,
} from './dto/help-center/admin-help-center.dto';

@Controller('api/admin/v1/help')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminHelpCenterController {
  constructor(private readonly helpCenter: AdminHelpCenterService) {}

  @Get('categories')
  listCategories(@CurrentUser() user: AuthUser) {
    return this.helpCenter.listCategories(user.roles);
  }

  @Patch('categories/reorder')
  reorderCategories(
    @CurrentUser() user: AuthUser,
    @Body() body: ReorderHelpCategoriesDto,
    @Req() req: Request,
  ) {
    return this.helpCenter.reorderCategories(
      user.id,
      user.roles,
      body,
      requestMeta(req),
    );
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateHelpCategoryDto,
    @Req() req: Request,
  ) {
    return this.helpCenter.createCategory(
      user.id,
      user.roles,
      body,
      requestMeta(req),
    );
  }

  @Patch('categories/:id')
  updateCategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateHelpCategoryDto,
    @Req() req: Request,
  ) {
    return this.helpCenter.updateCategory(
      user.id,
      user.roles,
      id,
      body,
      requestMeta(req),
    );
  }

  @Delete('categories/:id')
  deleteCategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.helpCenter.deleteCategory(
      user.id,
      user.roles,
      id,
      requestMeta(req),
    );
  }

  @Get('articles')
  listArticles(
    @CurrentUser() user: AuthUser,
    @Query() query: ListHelpArticlesAdminQueryDto,
  ) {
    return this.helpCenter.listArticles(user.roles, query);
  }

  @Patch('articles/reorder')
  reorderArticles(
    @CurrentUser() user: AuthUser,
    @Body() body: ReorderHelpArticlesDto,
    @Req() req: Request,
  ) {
    return this.helpCenter.reorderArticles(
      user.id,
      user.roles,
      body,
      requestMeta(req),
    );
  }

  @Post('articles')
  createArticle(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateHelpArticleDto,
    @Req() req: Request,
  ) {
    return this.helpCenter.createArticle(
      user.id,
      user.roles,
      body,
      requestMeta(req),
    );
  }

  @Patch('articles/:id/publish')
  publishArticle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.helpCenter.publishArticle(
      user.id,
      user.roles,
      id,
      requestMeta(req),
    );
  }

  @Patch('articles/:id/archive')
  archiveArticle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.helpCenter.archiveArticle(
      user.id,
      user.roles,
      id,
      requestMeta(req),
    );
  }

  @Patch('articles/:id')
  updateArticle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateHelpArticleDto,
    @Req() req: Request,
  ) {
    return this.helpCenter.updateArticle(
      user.id,
      user.roles,
      id,
      body,
      requestMeta(req),
    );
  }

  @Delete('articles/:id')
  deleteArticle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.helpCenter.deleteArticle(
      user.id,
      user.roles,
      id,
      requestMeta(req),
    );
  }
}
