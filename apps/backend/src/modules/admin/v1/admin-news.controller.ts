import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { requestMeta } from '../common/admin-http.util';
import { NEWS_IMAGE_LIMITS } from '../common/media-storage.constants';
import { AdminNewsService } from './admin-news.service';

class CreateNewsDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsString()
  content!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnHomepage?: boolean;

  @IsOptional()
  @IsBoolean()
  showInDashboard?: boolean;

  @IsOptional()
  @IsString()
  publishAt?: string;
}

class PatchNewsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  publishAt?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnHomepage?: boolean;

  @IsOptional()
  @IsBoolean()
  showInDashboard?: boolean;

  @IsOptional()
  @IsString()
  audience?: string;
}

function toUploadPayload(file: Express.Multer.File | undefined) {
  if (!file?.buffer) return undefined;
  return {
    buffer: file.buffer,
    mimetype: file.mimetype,
    size: file.size,
    originalname: file.originalname,
  };
}

@Controller('api/admin/v1/news')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminNewsController {
  constructor(private readonly news: AdminNewsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.news.list(
      user.roles,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
      status,
    );
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.news.getById(user.roles, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateNewsDto,
    @Req() req: Request,
  ) {
    return this.news.create(user.id, user.roles, body, requestMeta(req));
  }

  @Patch(':id')
  patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PatchNewsDto,
    @Req() req: Request,
  ) {
    return this.news.patch(user.id, user.roles, id, body, requestMeta(req));
  }

  @Post(':id/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: NEWS_IMAGE_LIMITS.maxBytes },
    }),
  )
  uploadCover(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.news.uploadCover(
      user.id,
      user.roles,
      id,
      toUploadPayload(file)!,
      requestMeta(req),
    );
  }

  @Post(':id/publish')
  publish(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.news.publish(user.id, user.roles, id, requestMeta(req));
  }

  @Post(':id/unpublish')
  unpublish(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.news.unpublish(user.id, user.roles, id, requestMeta(req));
  }

  @Post(':id/archive')
  archive(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.news.archive(user.id, user.roles, id, requestMeta(req));
  }
}
